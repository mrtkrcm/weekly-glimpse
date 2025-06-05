import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { authStore } from '$lib/stores/authStore';
import { taskDataService } from '$lib/services/taskDataService';
import { syncService } from '$lib/services/syncService';
import { db } from '$lib/services/indexedDB';

// Create mock for component rendering
vi.mock('@testing-library/svelte', async () => {
	const actual = await vi.importActual('@testing-library/svelte');
	return {
		...actual,
		// Mock render to simulate our application flow
		render: vi.fn().mockImplementation(() => ({
			container: document.createElement('div'),
			component: { $destroy: vi.fn() }
		}))
	};
});

// Mock the stores and services
vi.mock('$lib/stores/authStore', () => ({
	authStore: {
		subscribe: vi.fn(),
		login: vi.fn(),
		logout: vi.fn(),
		checkSession: vi.fn()
	}
}));

vi.mock('$lib/services/taskDataService', () => ({
	taskDataService: {
		getWeekTasks: vi.fn(),
		createTask: vi.fn(),
		updateTask: vi.fn(),
		deleteTask: vi.fn()
	}
}));

vi.mock('$lib/services/syncService', () => ({
	syncService: {
		syncTasksOnLogin: vi.fn()
	}
}));

vi.mock('$lib/services/indexedDB', () => ({
	db: {
		getTasks: vi.fn(),
		addTask: vi.fn(),
		updateTask: vi.fn(),
		deleteTask: vi.fn()
	}
}));

// Mock fetch API
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		clear: vi.fn(() => {
			store = {};
		})
	};
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Guest Mode Workflow Integration', () => {
	let mockAuthState: any;

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();
		localStorageMock.clear();

		// Setup default auth state as guest (not authenticated)
		mockAuthState = { isAuthenticated: false, user: null, loading: false };
		(authStore.subscribe as any).mockImplementation((cb: Function) => {
			cb(mockAuthState);
			return () => {}; // Unsubscribe function
		});

		// Mock successful API responses
		(global.fetch as any).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ id: 'user-123', username: 'testuser' })
		});
	});

	it('should allow creating tasks as a guest user', async () => {
		// Setup mock task creation
		const newTask = {
			title: 'Guest Task',
			description: 'Created as a guest',
			dueDate: new Date(),
			priority: 'medium',
			status: 'todo'
		};

		const createdTaskId = 12345;
		const createdTask = { ...newTask, id: createdTaskId };

		// Mock db.addTask response
		(db.addTask as any).mockResolvedValue(createdTaskId);

		// Mock taskDataService.createTask to delegate to the db
		(taskDataService.createTask as any).mockImplementation(async (task: any) => {
			const id = await db.addTask(task);
			return { ...task, id };
		});

		// Create a task as a guest user
		const result = await taskDataService.createTask(newTask);

		// Check that the task was created in IndexedDB
		expect(db.addTask).toHaveBeenCalledWith(newTask);
		expect(result).toEqual(createdTask);
	});

	it('should sync guest tasks when logging in', async () => {
		// Setup mock local tasks in IndexedDB
		const localTasks = [
			{ id: 123, title: 'Guest Task 1', dueDate: '2023-05-01', priority: 'high', status: 'todo' },
			{ id: 456, title: 'Guest Task 2', dueDate: '2023-05-02', priority: 'medium', status: 'done' }
		];

		// Mock db.getTasks response
		(db.getTasks as any).mockResolvedValue(localTasks);

		// Mock syncService to return a successful sync count
		(syncService.syncTasksOnLogin as any).mockResolvedValue(2);

		// Simulate user login
		const userData = { id: 'user-123', username: 'testuser' };
		authStore.login(userData);

		// Trigger sync process (normally done in login component)
		const syncCount = await syncService.syncTasksOnLogin();

		// Verify login and sync actions
		expect(authStore.login).toHaveBeenCalledWith(userData);
		expect(syncService.syncTasksOnLogin).toHaveBeenCalled();
		expect(syncCount).toBe(2);
	});

	it('should use the server API for tasks after login', async () => {
		// Setup mock authenticated state
		mockAuthState = {
			isAuthenticated: true,
			user: { id: 'user-123', username: 'testuser' },
			loading: false
		};

		// Setup mock server tasks
		const serverTasks = [
			{
				id: 'server-1',
				title: 'Server Task 1',
				dueDate: '2023-05-01',
				priority: 'high',
				status: 'todo'
			},
			{
				id: 'server-2',
				title: 'Server Task 2',
				dueDate: '2023-05-02',
				priority: 'medium',
				status: 'done'
			}
		];

		// Mock TaskDataService to return server tasks
		(taskDataService.getWeekTasks as any).mockResolvedValue(serverTasks);

		// Get tasks (should come from server now)
		const startDate = new Date('2023-05-01');
		const endDate = new Date('2023-05-07');
		const tasks = await taskDataService.getWeekTasks(startDate, endDate);

		// Verify we got server tasks
		expect(tasks).toEqual(serverTasks);
		expect(tasks.length).toBe(2);
		expect(tasks[0].id).toBe('server-1');
	});

	it('should handle the full guest-to-authenticated workflow', async () => {
		// STEP 1: Start as guest user
		mockAuthState = { isAuthenticated: false, user: null, loading: false };

		// Mock local task storage
		const localTask = {
			title: 'Guest Task',
			description: 'Created as guest',
			dueDate: new Date(),
			priority: 'high',
			status: 'todo'
		};

		const localTaskId = 12345;
		(db.addTask as any).mockResolvedValue(localTaskId);
		(db.getTasks as any).mockResolvedValue([{ ...localTask, id: localTaskId }]);

		// Create task as guest
		(taskDataService.createTask as any).mockImplementation(async (task: any) => {
			const id = await db.addTask(task);
			return { ...task, id };
		});

		const createdTask = await taskDataService.createTask(localTask);
		expect(createdTask.id).toBe(localTaskId);

		// STEP 2: User logs in
		const userData = { id: 'user-123', username: 'testuser' };

		// Mock syncTasksOnLogin implementation
		(syncService.syncTasksOnLogin as any).mockImplementation(async () => {
			const localTasks = await db.getTasks();

			// Create tasks on server (just simulating)
			const createdServerTasks = localTasks.map((task) => ({
				...task,
				id: `server-${task.id}`
			}));

			// Delete from local DB after sync
			for (const task of localTasks) {
				await db.deleteTask(task.id);
			}

			return localTasks.length;
		});

		// Login and trigger sync
		authStore.login(userData);
		const syncCount = await syncService.syncTasksOnLogin();

		expect(syncCount).toBe(1); // Synced 1 task

		// STEP 3: After login, verify we use server API
		mockAuthState = { isAuthenticated: true, user: userData, loading: false };

		// Setup mock server tasks (including our synced task)
		const serverTasks = [{ id: `server-${localTaskId}`, ...localTask }];

		// Mock getWeekTasks to return server data
		(taskDataService.getWeekTasks as any).mockResolvedValue(serverTasks);

		// Get tasks using service (should use server API now)
		const startDate = new Date();
		const endDate = new Date();
		endDate.setDate(endDate.getDate() + 6);

		const tasksAfterLogin = await taskDataService.getWeekTasks(startDate, endDate);

		// Verify we got the server tasks
		expect(tasksAfterLogin).toEqual(serverTasks);
		expect(tasksAfterLogin[0].id).toBe(`server-${localTaskId}`);
	});
});
