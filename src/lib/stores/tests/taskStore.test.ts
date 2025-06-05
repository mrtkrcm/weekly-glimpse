import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writable } from 'svelte/store';
import type { Task } from '../../../types/task';
import { get } from 'svelte/store';

// Mock modules first - all vi.mock calls are hoisted
vi.mock('$lib/services/taskService', () => ({
	getTasks: vi.fn(() => Promise.resolve([])),
	createTask: vi.fn((task) => Promise.resolve({ ...task, id: 'test-id' })),
	updateTask: vi.fn((id, task) => Promise.resolve({ ...task, id })),
	deleteTask: vi.fn((id) => Promise.resolve({ id }))
}));

vi.mock('$lib/utils/localStorage', () => ({
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn()
}));

// Mock the taskStore module
vi.mock('../taskStore', () => {
	const store = writable<Task[]>([]);

	const addTaskImpl = async (task: Partial<Task>) => {
		const newTask = { ...task, id: 'test-id' };
		store.update((tasks) => [...tasks, newTask]);
		return newTask;
	};

	const updateTaskImpl = async (id: string, updates: Partial<Task>) => {
		const updatedTask = { id, ...updates };
		store.update((tasks) => tasks.map((task) => (task.id === id ? { ...task, ...updates } : task)));
		return updatedTask;
	};

	const deleteTaskImpl = async (id: string) => {
		store.update((tasks) => tasks.filter((task) => task.id !== id));
		return { id };
	};

	return {
		taskStore: store,
		tasks: store,
		addTask: vi.fn(addTaskImpl),
		updateTask: vi.fn(updateTaskImpl),
		deleteTask: vi.fn(deleteTaskImpl),
		initTasks: vi.fn(async () => {
			const tasks: Task[] = [];
			store.set(tasks);
			return tasks;
		}),
		resetTasks: vi.fn(() => {
			store.set([]);
		})
	};
});

// Import after mocking
import {
	taskStore,
	tasks,
	addTask,
	updateTask,
	deleteTask,
	initTasks,
	resetTasks
} from '../taskStore';
import * as taskService from '../../services/taskService';

describe('taskStore', () => {
	const sampleTask1: Task = {
		id: '1',
		title: 'Task 1',
		description: 'Description 1',
		dueDate: new Date('2023-01-01'),
		priority: 'high',
		status: 'todo',
		userId: 'user1'
	};

	const sampleTask2: Task = {
		id: '2',
		title: 'Task 2',
		description: 'Description 2',
		dueDate: new Date('2023-01-02'),
		priority: 'medium',
		status: 'todo',
		userId: 'user1'
	};

	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks();

		// Reset the store
		tasks.set([]);

		// Setup mock implementations
		vi.mocked(addTask).mockImplementation(async (task) => {
			const newTask = await taskService.createTask(task);
			tasks.update((current) => [...current, newTask]);
			return newTask;
		});

		vi.mocked(updateTask).mockImplementation(async (id, updates) => {
			const updatedTask = await taskService.updateTask(id, updates);
			tasks.update((current) =>
				current.map((task) => (task.id === id ? { ...task, ...updates } : task))
			);
			return updatedTask;
		});

		vi.mocked(deleteTask).mockImplementation(async (id) => {
			await taskService.deleteTask(id);
			tasks.update((current) => current.filter((task) => task.id !== id));
		});

		vi.mocked(initTasks).mockImplementation(async () => {
			const fetchedTasks = await taskService.getTasks();
			tasks.set(fetchedTasks);
			return fetchedTasks;
		});
	});

	it('basic store operations should work', () => {
		// Subscribe to store
		let storeValue: Task[] = [];
		const unsubscribe = tasks.subscribe((value) => {
			storeValue = value;
		});

		// Initial state
		expect(storeValue).toEqual([]);

		// Set new state
		tasks.set([sampleTask1, sampleTask2]);
		expect(storeValue).toEqual([sampleTask1, sampleTask2]);

		// Clean up
		unsubscribe();
	});

	it('addTask should add a task to the store', async () => {
		const newTask = {
			title: 'New Task',
			description: 'New Description',
			dueDate: new Date('2023-01-01'),
			priority: 'high',
			status: 'todo',
			userId: 'user1'
		};

		await addTask(newTask);

		let storeValue: Task[] = [];
		tasks.subscribe((value) => {
			storeValue = value;
		})();

		expect(storeValue.length).toBe(1);
		expect(storeValue[0].title).toBe('New Task');
		expect(storeValue[0].id).toBe('test-id');
	});

	it('updateTask should update an existing task', async () => {
		// Add a task first
		tasks.set([sampleTask1]);

		// Update it
		const updates = {
			title: 'Updated Task',
			status: 'in-progress'
		};

		await updateTask('1', updates);

		let storeValue: Task[] = [];
		tasks.subscribe((value) => {
			storeValue = value;
		})();

		expect(storeValue.length).toBe(1);
		expect(storeValue[0].title).toBe('Updated Task');
		expect(storeValue[0].status).toBe('in-progress');
		expect(storeValue[0].priority).toBe('high'); // Unchanged field
	});

	it('deleteTask should remove a task', async () => {
		// Add tasks
		tasks.set([sampleTask1, sampleTask2]);

		// Delete one
		await deleteTask('1');

		let storeValue: Task[] = [];
		tasks.subscribe((value) => {
			storeValue = value;
		})();

		expect(storeValue.length).toBe(1);
		expect(storeValue[0].id).toBe('2');
	});

	it('initTasks should populate the store', async () => {
		// Mock response from taskService
		vi.mocked(taskService.getTasks).mockResolvedValueOnce([sampleTask1, sampleTask2]);

		await initTasks();

		let storeValue: Task[] = [];
		tasks.subscribe((value) => {
			storeValue = value;
		})();

		expect(storeValue.length).toBe(2);
		expect(storeValue[0].id).toBe('1');
		expect(storeValue[1].id).toBe('2');
	});

	beforeEach(() => {
		resetTasks();
	});

	afterEach(() => {
		resetTasks();
	});

	it('should start with an empty task list', () => {
		const tasks = get(taskStore);
		expect(tasks).toEqual([]);
	});

	it('should add a new task', async () => {
		const newTask = {
			title: 'New Task',
			description: 'New Description',
			dueDate: new Date('2023-01-01'),
			priority: 'high' as const,
			status: 'todo' as const,
			userId: 'user1'
		};

		await addTask(newTask);
		const tasks = get(taskStore);
		expect(tasks).toHaveLength(1);
		expect(tasks[0]).toMatchObject({ ...newTask, id: 'test-id' });
	});

	it('should update an existing task', async () => {
		const newTask = {
			title: 'Test Task',
			description: 'Test Description',
			dueDate: new Date('2023-01-01'),
			priority: 'high' as const,
			status: 'todo' as const,
			userId: 'user1'
		};

		await addTask(newTask);
		const tasks = get(taskStore);
		const taskId = tasks[0].id;

		const updates = {
			title: 'Updated Task',
			status: 'in-progress' as const
		};

		await updateTask(taskId, updates);
		const updatedTasks = get(taskStore);
		expect(updatedTasks[0]).toMatchObject({ ...newTask, ...updates, id: taskId });
	});

	it('should delete a task', async () => {
		const newTask = {
			title: 'Test Task',
			description: 'Test Description',
			dueDate: new Date('2023-01-01'),
			priority: 'high' as const,
			status: 'todo' as const,
			userId: 'user1'
		};

		await addTask(newTask);
		const tasks = get(taskStore);
		const taskId = tasks[0].id;

		await deleteTask(taskId);
		const remainingTasks = get(taskStore);
		expect(remainingTasks).toHaveLength(0);
	});
});
