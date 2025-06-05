import type { Task, TaskResponse } from './task';

export interface ServerToClientEvents {
	taskCreated: (task: Task) => void;
	taskUpdated: (task: Task) => void;
	taskDeleted: (taskId: string) => void;
	error: (error: { message: string; code: string }) => void;
}

export interface ClientToServerEvents {
	createTask: (task: Omit<Task, 'id'>, callback: (response: TaskResponse) => void) => void;
	updateTask: (task: Task, callback: (response: TaskResponse) => void) => void;
	deleteTask: (
		taskId: string,
		callback: (response: { success: boolean; error?: string }) => void
	) => void;
}
