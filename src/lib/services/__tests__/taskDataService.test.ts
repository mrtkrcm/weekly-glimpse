import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskDataService } from '$lib/services/taskDataService';
import { db } from '$lib/services/indexedDB';
import { TaskApi } from '$lib/client/api';
import { get } from 'svelte/store';
import { authStore } from '$lib/stores/authStore';

// Mock dependencies
vi.mock('$lib/services/indexedDB', () => ({
	db: {
		getTasks: vi.fn(),
		addTask: vi.fn(),
		updateTask: vi.fn(),
		deleteTask: vi.fn()
	}
}));

vi.mock('$lib/client/api', () => ({
	TaskApi: {
		getWeekTasks: vi.fn(),
		createTask: vi.fn(),
		updateTask: vi.fn(),
		deleteTask: vi.fn()
	}
}));

vi.mock('svelte/store', () => ({
	get: vi.fn()
}));

vi.mock('$lib/stores/authStore', () => ({
	authStore: {
		subscribe: vi.fn()
	}
}));

vi.mock('$app/environment', () => ({
	browser: true
}));

describe('TaskDataService', () => {
	let service: TaskDataService;
	const mockAuthenticatedState = { isAuthenticated: true, user: { id: '1', username: 'testuser' } };
	const mockGuestState = { isAuthenticated: false, user: null };

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();
		service = new TaskDataService();
	});

	describe('getWeekTasks', () => {
		it('should use API for authenticated users', async () => {
			// Setup mock auth state
			(get as any).mockReturnValue(mockAuthenticatedState);

			const mockTasks = [{ id: '1', title: 'Task 1' }];
			(TaskApi.getWeekTasks as any).mockResolvedValue(mockTasks);

			const startDate = new Date('2023-01-01');
			const endDate = new Date('2023-01-07');

			const result = await service.getWeekTasks(startDate, endDate);

			expect(get).toHaveBeenCalledWith(authStore);
			expect(TaskApi.getWeekTasks).toHaveBeenCalledWith(startDate, endDate);
			expect(db.getTasks).not.toHaveBeenCalled();
			expect(result).toEqual(mockTasks);
		});

		it('should use IndexedDB for guest users', async () => {
			// Setup mock auth state
			(get as any).mockReturnValue(mockGuestState);

			const mockTasks = [{ id: '2', title: 'Local Task' }];
			(db.getTasks as any).mockResolvedValue(mockTasks);

			const startDate = new Date('2023-01-01');
			const endDate = new Date('2023-01-07');

			const result = await service.getWeekTasks(startDate, endDate);

			expect(get).toHaveBeenCalledWith(authStore);
			expect(TaskApi.getWeekTasks).not.toHaveBeenCalled();
			expect(db.getTasks).toHaveBeenCalled();
			expect(result).toEqual(mockTasks);
		});
	});

	describe('createTask', () => {
		it('should use API for authenticated users', async () => {
			// Setup mock auth state
			(get as any).mockReturnValue(mockAuthenticatedState);

			const taskData = { title: 'New Task', priority: 'medium' };
			const createdTask = { id: '3', ...taskData };

			(TaskApi.createTask as any).mockResolvedValue(createdTask);

			const result = await service.createTask(taskData);

			expect(get).toHaveBeenCalledWith(authStore);
			expect(TaskApi.createTask).toHaveBeenCalledWith(taskData);
			expect(db.addTask).not.toHaveBeenCalled();
			expect(result).toEqual(createdTask);
		});

		it('should use IndexedDB for guest users', async () => {
			// Setup mock auth state
			(get as any).mockReturnValue(mockGuestState);

			const taskData = { title: 'New Local Task', priority: 'high' };
			const newId = 12345;

			(db.addTask as any).mockResolvedValue(newId);

			const result = await service.createTask(taskData);

			expect(get).toHaveBeenCalledWith(authStore);
			expect(TaskApi.createTask).not.toHaveBeenCalled();
			expect(db.addTask).toHaveBeenCalledWith(taskData);
			expect(result).toEqual({ ...taskData, id: newId });
		});
	});

	describe('updateTask', () => {
		it('should use API for authenticated users', async () => {
			// Setup mock auth state
			(get as any).mockReturnValue(mockAuthenticatedState);

			const taskData = { id: '4', title: 'Updated Task', status: 'done' };
			const updatedTask = { ...taskData, updatedAt: new Date() };

			(TaskApi.updateTask as any).mockResolvedValue(updatedTask);

			const result = await service.updateTask(taskData);

			expect(get).toHaveBeenCalledWith(authStore);
			expect(TaskApi.updateTask).toHaveBeenCalledWith(taskData);
			expect(db.updateTask).not.toHaveBeenCalled();
			expect(result).toEqual(updatedTask);
		});

		it('should use IndexedDB for guest users', async () => {
			// Setup mock auth state
			(get as any).mockReturnValue(mockGuestState);

			const taskData = { id: '5', title: 'Updated Local Task', status: 'done' };

			(db.updateTask as any).mockResolvedValue(1);

			const result = await service.updateTask(taskData);

			expect(get).toHaveBeenCalledWith(authStore);
			expect(TaskApi.updateTask).not.toHaveBeenCalled();
			expect(db.updateTask).toHaveBeenCalledWith(taskData);
			expect(result).toEqual(taskData);
		});
	});

	describe('deleteTask', () => {
		it('should use API for authenticated users', async () => {
			// Setup mock auth state
			(get as any).mockReturnValue(mockAuthenticatedState);

			const taskId = 6;

			(TaskApi.deleteTask as any).mockResolvedValue(undefined);

			await service.deleteTask(taskId);

			expect(get).toHaveBeenCalledWith(authStore);
			expect(TaskApi.deleteTask).toHaveBeenCalledWith(taskId);
			expect(db.deleteTask).not.toHaveBeenCalled();
		});

		it('should use IndexedDB for guest users', async () => {
			// Setup mock auth state
			(get as any).mockReturnValue(mockGuestState);

			const taskId = 7;

			(db.deleteTask as any).mockResolvedValue(undefined);

			await service.deleteTask(taskId);

			expect(get).toHaveBeenCalledWith(authStore);
			expect(TaskApi.deleteTask).not.toHaveBeenCalled();
			expect(db.deleteTask).toHaveBeenCalledWith(taskId);
		});
	});
});
