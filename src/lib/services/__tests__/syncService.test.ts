import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncService } from '$lib/services/syncService';
import { db } from '$lib/services/indexedDB';
import { TaskApi } from '$lib/client/api';

// Mock dependencies
vi.mock('$lib/services/indexedDB', () => ({
	db: {
		getTasks: vi.fn(),
		deleteTask: vi.fn()
	}
}));

vi.mock('$lib/client/api', () => ({
	TaskApi: {
		getWeekTasks: vi.fn(),
		createTask: vi.fn(),
		updateTask: vi.fn()
	}
}));

describe('SyncService', () => {
	let service: SyncService;

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();
		service = new SyncService();
	});

	describe('syncTasksOnLogin', () => {
		it('should return 0 if there are no local tasks', async () => {
			// Setup mock local tasks (empty)
			(db.getTasks as any).mockResolvedValue([]);

			const result = await service.syncTasksOnLogin();

			expect(db.getTasks).toHaveBeenCalledTimes(1);
			expect(TaskApi.getWeekTasks).not.toHaveBeenCalled();
			expect(result).toBe(0);
		});

		it('should sync new tasks to the server', async () => {
			// Setup mock local tasks
			const localTasks = [
				{ id: 123, title: 'Task 1', dueDate: '2023-05-01', priority: 'high', completed: false },
				{ id: 456, title: 'Task 2', dueDate: '2023-05-02', priority: 'medium', completed: true }
			];

			// Setup mock server tasks (no matches)
			const serverTasks = [
				{ id: 789, title: 'Server Task', dueDate: '2023-05-03', priority: 'low', completed: false }
			];

			(db.getTasks as any).mockResolvedValue(localTasks);
			(TaskApi.getWeekTasks as any).mockResolvedValue(serverTasks);
			(TaskApi.createTask as any).mockResolvedValueOnce({ id: 'new-1', ...localTasks[0] });
			(TaskApi.createTask as any).mockResolvedValueOnce({ id: 'new-2', ...localTasks[1] });
			(db.deleteTask as any).mockResolvedValue(undefined);

			const result = await service.syncTasksOnLogin();

			// Check that we retrieved local and server tasks
			expect(db.getTasks).toHaveBeenCalledTimes(1);
			expect(TaskApi.getWeekTasks).toHaveBeenCalledTimes(1);

			// Check that we created tasks on the server
			expect(TaskApi.createTask).toHaveBeenCalledTimes(2);
			expect(TaskApi.createTask).toHaveBeenCalledWith({
				title: localTasks[0].title,
				description: localTasks[0].description,
				dueDate: localTasks[0].dueDate,
				priority: localTasks[0].priority,
				completed: localTasks[0].completed,
				color: localTasks[0].color
			});

			// Check that we deleted local tasks after sync
			expect(db.deleteTask).toHaveBeenCalledTimes(2);
			expect(db.deleteTask).toHaveBeenCalledWith(localTasks[0].id);
			expect(db.deleteTask).toHaveBeenCalledWith(localTasks[1].id);

			// Check result count
			expect(result).toBe(2);
		});

		it('should update existing tasks on the server if matching', async () => {
			// Local and server have a matching task (same title and dueDate)
			const localTask = {
				id: 123,
				title: 'Matching Task',
				dueDate: '2023-05-01',
				description: 'Updated description',
				priority: 'high',
				completed: true
			};

			const serverTask = {
				id: 'server-123',
				title: 'Matching Task',
				dueDate: '2023-05-01',
				description: 'Old description',
				priority: 'medium',
				completed: false
			};

			(db.getTasks as any).mockResolvedValue([localTask]);
			(TaskApi.getWeekTasks as any).mockResolvedValue([serverTask]);
			(TaskApi.updateTask as any).mockResolvedValue({
				...serverTask,
				...localTask,
				id: 'server-123'
			});
			(db.deleteTask as any).mockResolvedValue(undefined);

			const result = await service.syncTasksOnLogin();

			// Verify we checked for potential duplicates
			expect(TaskApi.getWeekTasks).toHaveBeenCalledTimes(1);

			// Verify we updated instead of creating
			expect(TaskApi.updateTask).toHaveBeenCalledTimes(1);
			expect(TaskApi.updateTask).toHaveBeenCalledWith({
				...serverTask,
				title: localTask.title,
				description: localTask.description,
				priority: localTask.priority,
				completed: localTask.completed
			});
			expect(TaskApi.createTask).not.toHaveBeenCalled();

			// Verify we deleted the local task
			expect(db.deleteTask).toHaveBeenCalledWith(localTask.id);

			// Verify result count
			expect(result).toBe(1);
		});

		it('should handle errors during sync and continue with other tasks', async () => {
			// Setup two local tasks, but one will fail to sync
			const localTasks = [
				{ id: 123, title: 'Task 1', dueDate: '2023-05-01', priority: 'high', completed: false },
				{ id: 456, title: 'Task 2', dueDate: '2023-05-02', priority: 'medium', completed: true }
			];

			(db.getTasks as any).mockResolvedValue(localTasks);
			(TaskApi.getWeekTasks as any).mockResolvedValue([]);

			// First task fails to create, second succeeds
			(TaskApi.createTask as any).mockRejectedValueOnce(new Error('Network error'));
			(TaskApi.createTask as any).mockResolvedValueOnce({ id: 'new-2', ...localTasks[1] });

			// Only one task gets deleted
			(db.deleteTask as any).mockResolvedValue(undefined);

			// Spy on console.error
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const result = await service.syncTasksOnLogin();

			// Verify error was logged
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				`Error syncing task ${localTasks[0].id}:`,
				expect.any(Error)
			);

			// Verify we tried to create both tasks
			expect(TaskApi.createTask).toHaveBeenCalledTimes(2);

			// Verify we only deleted the second task
			expect(db.deleteTask).toHaveBeenCalledTimes(1);
			expect(db.deleteTask).toHaveBeenCalledWith(localTasks[1].id);

			// Verify result count
			expect(result).toBe(1);

			// Restore console.error
			consoleErrorSpy.mockRestore();
		});
	});

	describe('findPotentialDuplicate', () => {
		it('should find a matching task with same title and due date', () => {
			const localTask = {
				id: 123,
				title: 'Matching Task',
				dueDate: '2023-05-01',
				priority: 'high'
			};

			const serverTasks = [
				{ id: 'server-1', title: 'Different Task', dueDate: '2023-05-01' },
				{ id: 'server-2', title: 'Matching Task', dueDate: '2023-05-01' },
				{ id: 'server-3', title: 'Matching Task', dueDate: '2023-05-02' }
			];

			// Use the private method via any casting
			const result = (service as any).findPotentialDuplicate(localTask, serverTasks);

			expect(result).toEqual(serverTasks[1]);
		});

		it('should return null if no match is found', () => {
			const localTask = {
				id: 123,
				title: 'Unique Task',
				dueDate: '2023-05-01',
				priority: 'high'
			};

			const serverTasks = [
				{ id: 'server-1', title: 'Different Task', dueDate: '2023-05-01' },
				{ id: 'server-2', title: 'Another Task', dueDate: '2023-05-02' }
			];

			// Use the private method via any casting
			const result = (service as any).findPotentialDuplicate(localTask, serverTasks);

			expect(result).toBeNull();
		});
	});
});
