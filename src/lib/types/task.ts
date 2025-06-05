import type { Task as BaseTask } from '../../types/task';

/**
 * Extended task interface with additional properties used within the application
 */
export interface ExtendedTask extends BaseTask {
	// Additional application-specific properties
	displayDate?: string;
	isOverdue?: boolean;
	relativeTime?: string;
	isPending?: boolean;
}

/**
 * Task creation payload that requires minimal fields
 */
export type TaskCreatePayload = Omit<BaseTask, 'id'> & {
	id?: string | number;
};

/**
 * Task update payload that requires id
 */
export type TaskUpdatePayload = Partial<BaseTask> & {
	id: string | number;
};

export interface TaskResponse {
	task: ExtendedTask;
	success: boolean;
	error?: string;
}
