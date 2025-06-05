import { db } from './indexedDB';
import { TaskApi } from '$lib/client/api';
import type { Task } from '$lib/types/task';

export class SyncService {
	/**
	 * Synchronize locally stored tasks with the server after login
	 * @returns The number of tasks synchronized
	 */
	async syncTasksOnLogin(): Promise<number> {
		try {
			// Get all local tasks
			const localTasks = await db.getTasks();

			if (localTasks.length === 0) {
				console.log('No local tasks to sync');
				return 0;
			}

			console.log(`Starting sync of ${localTasks.length} local tasks`);

			// Get current server tasks to avoid duplication
			const today = new Date();
			// Get tasks for a wide date range to include all local tasks
			const sixMonthsAgo = new Date(today);
			sixMonthsAgo.setMonth(today.getMonth() - 6);

			const sixMonthsAhead = new Date(today);
			sixMonthsAhead.setMonth(today.getMonth() + 6);

			const serverTasks = await TaskApi.getWeekTasks(sixMonthsAgo, sixMonthsAhead);

			// Track tasks that were successfully synced
			const syncedTaskIds: number[] = [];

			// Process each local task
			for (const localTask of localTasks) {
				try {
					// Check if this task might already exist on the server (by matching properties)
					const potentialDuplicate = this.findPotentialDuplicate(localTask, serverTasks);

					if (potentialDuplicate) {
						// Update the server task if the local one is newer or has different properties
						// For simplicity, we're just considering them different here
						await TaskApi.updateTask({
							...potentialDuplicate,
							title: localTask.title,
							description: localTask.description,
							priority: localTask.priority,
							completed: localTask.completed
						});
					} else {
						// Create a new task on the server
						await TaskApi.createTask({
							title: localTask.title,
							description: localTask.description,
							dueDate: localTask.dueDate,
							priority: localTask.priority,
							completed: localTask.completed,
							color: localTask.color
						});
					}

					// Mark as synced
					syncedTaskIds.push(localTask.id);
				} catch (error) {
					console.error(`Error syncing task ${localTask.id}:`, error);
				}
			}

			// Remove synced tasks from local database
			for (const id of syncedTaskIds) {
				await db.deleteTask(id);
			}

			console.log(`Synced ${syncedTaskIds.length} tasks successfully`);
			return syncedTaskIds.length;
		} catch (error) {
			console.error('Sync error:', error);
			throw new Error('Failed to synchronize tasks');
		}
	}

	/**
	 * Try to find a task on the server that might be the same as a local task
	 */
	private findPotentialDuplicate(localTask: Task, serverTasks: Task[]): Task | null {
		// Look for an exact title match with the same due date
		return (
			serverTasks.find(
				(serverTask) =>
					serverTask.title === localTask.title && serverTask.dueDate === localTask.dueDate
			) || null
		);
	}
}

export const syncService = new SyncService();
