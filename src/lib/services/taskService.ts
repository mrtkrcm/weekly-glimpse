import type { Task } from '$lib/types/task';
import { socket } from '$lib/server/socket';

export async function updateTaskStatus(taskId: string, status: Task['status']): Promise<Task> {
	return new Promise((resolve, reject) => {
		socket.emit('updateTask', { id: taskId, status }, (response) => {
			if (response.success) {
				resolve(response.task);
			} else {
				reject(new Error(response.error || 'Failed to update task'));
			}
		});
	});
}

export async function deleteTask(taskId: string): Promise<void> {
	return new Promise((resolve, reject) => {
		socket.emit('deleteTask', taskId, (response) => {
			if (response.success) {
				resolve();
			} else {
				reject(new Error(response.error || 'Failed to delete task'));
			}
		});
	});
}

export async function fetchTasks(): Promise<Task[]> {
	return Promise.resolve([]);
}
