import { describe, it, expect } from 'vitest';
import { validateTask, taskSchema, TASK_STATUS, TASK_PRIORITY } from './validation';

describe('Validation', () => {
	it('should validate a valid task', () => {
		const taskData = {
			title: 'Test Task',
			description: 'Test Description',
			dueDate: '2024-03-25T12:00:00.000Z',
			priority: TASK_PRIORITY.MEDIUM,
			status: TASK_STATUS.TODO
		};

		const result = validateTask(taskData);
		expect(result.success).toBe(true);
	});

	it('should invalidate a task with missing title', () => {
		const taskData = {
			description: 'Test Description',
			dueDate: '2024-03-25T12:00:00.000Z',
			priority: TASK_PRIORITY.MEDIUM,
			status: TASK_STATUS.TODO
		};

		const result = validateTask(taskData);
		expect(result.success).toBe(false);
	});

	it('should invalidate a task with long title', () => {
		const taskData = {
			title:
				'This is a very long title that exceeds the maximum length of 100 characters. This is a very long title that exceeds the maximum length of 100 characters.',
			description: 'Test Description',
			dueDate: '2024-03-25T12:00:00.000Z',
			priority: TASK_PRIORITY.MEDIUM,
			status: TASK_STATUS.TODO
		};

		const result = validateTask(taskData);
		expect(result.success).toBe(false);
	});

	it('should invalidate a task with invalid date', () => {
		const taskData = {
			title: 'Test Task',
			description: 'Test Description',
			dueDate: 'invalid-date',
			priority: TASK_PRIORITY.MEDIUM,
			status: TASK_STATUS.TODO
		};

		const result = validateTask(taskData);
		expect(result.success).toBe(false);
	});

	it('should invalidate a task with invalid priority', () => {
		const taskData = {
			title: 'Test Task',
			description: 'Test Description',
			dueDate: '2024-03-25T12:00:00.000Z',
			priority: 'invalid' as any,
			status: TASK_STATUS.TODO
		};

		const result = validateTask(taskData);
		expect(result.success).toBe(false);
	});

	it('should invalidate a task with invalid status', () => {
		const taskData = {
			title: 'Test Task',
			description: 'Test Description',
			dueDate: '2024-03-25T12:00:00.000Z',
			priority: TASK_PRIORITY.MEDIUM,
			status: 'invalid' as any
		};

		const result = validateTask(taskData);
		expect(result.success).toBe(false);
	});
});
