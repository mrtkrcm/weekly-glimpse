import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Task } from '$lib/types/task';

// Create mock table
const mockTable = {
	toArray: vi.fn(),
	add: vi.fn(),
	update: vi.fn(),
	delete: vi.fn(),
	where: vi.fn(() => ({
		equals: vi.fn(() => ({
			first: vi.fn()
		}))
	}))
};

// Create mock database
const mockDb = {
	tasks: mockTable,
	getTasks: async () => {
		const tasks = await mockTable.toArray();
		return tasks;
	},
	addTask: async (task: Task) => {
		await mockTable.add(task);
		return task.id;
	},
	updateTask: async (id: string, task: Task) => {
		await mockTable.update(id, task);
		return 1;
	},
	deleteTask: async (id: string) => {
		await mockTable.delete(id);
	}
};

// Mock the module
vi.mock('../services/indexedDB', () => ({
	default: mockDb
}));

describe('IndexedDB', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const mockTask: Task = {
		id: '1',
		title: 'Test Task',
		completed: false,
		color: '#000000',
		createdAt: '2025-03-25T08:24:49.185Z',
		updatedAt: '2025-03-25T08:24:49.185Z'
	};

	const mockTasks = [mockTask];

	it('should get tasks', async () => {
		mockTable.toArray.mockResolvedValue(mockTasks);

		const tasks = await mockDb.getTasks();
		expect(tasks).toEqual(mockTasks);
		expect(mockTable.toArray).toHaveBeenCalled();
	});

	it('should add a task', async () => {
		mockTable.add.mockResolvedValue('1');

		await mockDb.addTask(mockTask);
		expect(mockTable.add).toHaveBeenCalledWith(mockTask);
	});

	it('should update a task', async () => {
		mockTable.update.mockResolvedValue(1);

		await mockDb.updateTask('1', mockTask);
		expect(mockTable.update).toHaveBeenCalledWith('1', mockTask);
	});

	it('should delete a task', async () => {
		mockTable.delete.mockResolvedValue(undefined);

		await mockDb.deleteTask('1');
		expect(mockTable.delete).toHaveBeenCalledWith('1');
	});
});
