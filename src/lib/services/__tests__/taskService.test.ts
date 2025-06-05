import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateTaskStatus, deleteTask, fetchTasks } from '../taskService';
import { socket } from '$lib/server/socket';
import { taskStore } from '$lib/stores/taskStore';

// Mock socket
vi.mock('$lib/server/socket', () => ({
	socket: {
		emit: vi.fn()
	}
}));

// Mock taskStore
vi.mock('$lib/stores/taskStore', () => ({
	taskStore: {
		set: vi.fn(),
		subscribe: vi.fn()
	}
}));

describe('taskService', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		taskStore.set([]);
	});

	describe('updateTaskStatus', () => {
		it('should call socket.emit with correct parameters and resolve on success', async () => {
			const mockTask = { id: '1', status: 'completed' };
			const mockResponse = { success: true, task: mockTask };

			// Mock socket.emit to call the callback with success
			vi.mocked(socket.emit).mockImplementation((event, data, callback) => {
				callback(mockResponse);
				return socket;
			});

			const result = await updateTaskStatus('1', 'completed');

			expect(socket.emit).toHaveBeenCalledWith(
				'updateTask',
				{ id: '1', status: 'completed' },
				expect.any(Function)
			);
			expect(result).toEqual(mockTask);
		});

		it('should reject with error message on failure', async () => {
			const mockError = 'Update failed';
			const mockResponse = { success: false, error: mockError };

			vi.mocked(socket.emit).mockImplementation((event, data, callback) => {
				callback(mockResponse);
				return socket;
			});

			await expect(updateTaskStatus('1', 'completed')).rejects.toThrow(mockError);
		});

		it('should use a default error message if none provided', async () => {
			const mockResponse = { success: false };

			vi.mocked(socket.emit).mockImplementation((event, data, callback) => {
				callback(mockResponse);
				return socket;
			});

			await expect(updateTaskStatus('1', 'completed')).rejects.toThrow('Failed to update task');
		});
	});

	describe('deleteTask', () => {
		it('should call socket.emit with correct parameters and resolve on success', async () => {
			const mockResponse = { success: true };

			vi.mocked(socket.emit).mockImplementation((event, data, callback) => {
				callback(mockResponse);
				return socket;
			});

			await deleteTask('1');

			expect(socket.emit).toHaveBeenCalledWith('deleteTask', '1', expect.any(Function));
		});

		it('should reject with error message on failure', async () => {
			const mockError = 'Delete failed';
			const mockResponse = { success: false, error: mockError };

			vi.mocked(socket.emit).mockImplementation((event, data, callback) => {
				callback(mockResponse);
				return socket;
			});

			await expect(deleteTask('1')).rejects.toThrow(mockError);
		});

		it('should use a default error message if none provided', async () => {
			const mockResponse = { success: false };

			vi.mocked(socket.emit).mockImplementation((event, data, callback) => {
				callback(mockResponse);
				return socket;
			});

			await expect(deleteTask('1')).rejects.toThrow('Failed to delete task');
		});
	});

	describe('fetchTasks', () => {
		it('should return an empty array', async () => {
			const tasks = await fetchTasks();
			expect(tasks).toEqual([]);
		});
	});
});
