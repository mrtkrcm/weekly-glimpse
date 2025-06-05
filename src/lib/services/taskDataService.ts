import { browser } from '$app/environment';
import { db } from './indexedDB';
import { TaskApi } from '$lib/client/api';
import type { Task } from '$lib/types/task';
import { authStore } from '$lib/stores/authStore';
import { get } from 'svelte/store';

/**
 * TaskDataService provides an abstraction over different data sources
 * based on authentication state
 */
export class TaskDataService {
	/**
	 * Get tasks for a specific week
	 */
	async getWeekTasks(startDate: Date, endDate: Date): Promise<Task[]> {
		if (browser) {
			// Use API when authenticated
			if (get(authStore).isAuthenticated) {
				return TaskApi.getWeekTasks(startDate, endDate);
			}
			// Use IndexedDB for guest users
			else {
				// For simplicity, we're returning all tasks from IndexedDB
				// In a real implementation, you'd filter by date range
				return db.getTasks();
			}
		}

		// Server-side fallback
		return [];
	}

	/**
	 * Create a new task
	 */
	async createTask(taskData: Omit<Task, 'id'>): Promise<Task> {
		if (browser) {
			if (get(authStore).isAuthenticated) {
				return TaskApi.createTask(taskData);
			} else {
				const id = await db.addTask(taskData);
				return { ...taskData, id } as Task;
			}
		}
		throw new Error('Cannot create task in server context');
	}

	/**
	 * Update an existing task
	 */
	async updateTask(taskData: Task): Promise<Task> {
		if (browser) {
			if (get(authStore).isAuthenticated) {
				return TaskApi.updateTask(taskData);
			} else {
				await db.updateTask(taskData);
				return taskData;
			}
		}
		throw new Error('Cannot update task in server context');
	}

	/**
	 * Delete a task
	 */
	async deleteTask(id: number): Promise<void> {
		if (browser) {
			if (get(authStore).isAuthenticated) {
				await TaskApi.deleteTask(id);
			} else {
				await db.deleteTask(id);
			}
		} else {
			throw new Error('Cannot delete task in server context');
		}
	}
}

export const taskDataService = new TaskDataService();
