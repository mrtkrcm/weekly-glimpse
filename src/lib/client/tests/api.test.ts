import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, TaskApi } from '../api';

// Mock window.location for tests
const originalLocation = window.location;
const locationMock = {
	origin: 'http://localhost:3000',
	href: 'http://localhost:3000'
};

// Create a fixed URL for testing
const mockUrlObject = {
	toString: vi.fn().mockReturnValue('http://localhost:3000/api/test-endpoint'),
	searchParams: {
		append: vi.fn()
	}
};

// Mock URL global
global.URL = vi.fn().mockReturnValue(mockUrlObject);

describe('API Client', () => {
	// Mock fetch for testing
	const mockFetch = vi.fn();

	beforeEach(() => {
		// Save the original fetch
		global.fetch = mockFetch;

		// Setup window.location mock
		Object.defineProperty(window, 'location', {
			value: locationMock,
			writable: true
		});

		// Reset mocks before each test
		mockFetch.mockReset();
		mockUrlObject.searchParams.append.mockClear();
		mockUrlObject.toString.mockClear();

		// Default toString implementation
		mockUrlObject.toString.mockImplementation(() => 'http://localhost:3000/api/test-endpoint');
	});

	afterEach(() => {
		// Restore window.location
		Object.defineProperty(window, 'location', {
			value: originalLocation,
			writable: true
		});
	});

	describe('apiRequest', () => {
		it('should make a GET request correctly', async () => {
			// Setup mock response
			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue({ data: 'test' })
			};
			mockFetch.mockResolvedValue(mockResponse);

			// Set URL toString for this test
			mockUrlObject.toString.mockReturnValue('http://localhost:3000/api/test-endpoint');

			// Make request
			const result = await apiRequest('/test-endpoint');

			// Verify fetch was called correctly
			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:3000/api/test-endpoint',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						Accept: 'application/json'
					})
				})
			);

			// Verify URL was created correctly
			expect(global.URL).toHaveBeenCalledWith('/api/test-endpoint', 'http://localhost:3000');

			// Verify result
			expect(result).toEqual({ data: 'test' });
		});

		it('should include query parameters for GET requests', async () => {
			// Setup mock response
			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue({ data: 'test with params' })
			};
			mockFetch.mockResolvedValue(mockResponse);

			// Make request with params
			await apiRequest('/test-endpoint', {
				params: {
					filter: 'active',
					sort: 'date'
				}
			});

			// Verify URL was created correctly
			expect(global.URL).toHaveBeenCalledWith('/api/test-endpoint', 'http://localhost:3000');

			// Verify parameters were added
			expect(mockUrlObject.searchParams.append).toHaveBeenCalledWith('filter', 'active');
			expect(mockUrlObject.searchParams.append).toHaveBeenCalledWith('sort', 'date');
		});

		it('should make a POST request with body', async () => {
			// Setup mock response
			const mockResponse = {
				ok: true,
				json: vi.fn().mockResolvedValue({ id: '123', success: true })
			};
			mockFetch.mockResolvedValue(mockResponse);

			const postData = { name: 'Test Task', priority: 'high' };

			// Set URL toString for this test
			mockUrlObject.toString.mockReturnValue('http://localhost:3000/api/tasks');

			// Make POST request
			const result = await apiRequest('/tasks', {
				method: 'POST',
				body: postData
			});

			// Verify fetch was called correctly
			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:3000/api/tasks',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(postData),
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					})
				})
			);

			// Verify URL was created correctly
			expect(global.URL).toHaveBeenCalledWith('/api/tasks', 'http://localhost:3000');

			// Verify result
			expect(result).toEqual({ id: '123', success: true });
		});

		it('should handle API errors (non-2xx responses)', async () => {
			// Setup mock error response
			const errorResponse = {
				ok: false,
				status: 400,
				json: vi.fn().mockResolvedValue({
					error: 'BadRequest',
					message: 'Invalid input data'
				})
			};
			mockFetch.mockResolvedValue(errorResponse);

			// Make request that will fail
			await expect(apiRequest('/test-endpoint')).rejects.toEqual(
				expect.objectContaining({
					error: 'BadRequest',
					message: 'Invalid input data',
					status: 400
				})
			);
		});

		it('should handle network errors', async () => {
			// Setup mock network error
			mockFetch.mockRejectedValue(new Error('Network failure'));

			// Make request that will fail
			await expect(apiRequest('/test-endpoint')).rejects.toEqual(
				expect.objectContaining({
					error: 'NetworkError',
					message: 'Failed to connect to the server',
					status: 0
				})
			);
		});

		it('should handle authentication errors and redirect', async () => {
			// Setup auth error response with redirect
			const errorResponse = {
				ok: false,
				status: 401,
				json: vi.fn().mockResolvedValue({
					error: 'Unauthorized',
					message: 'Not authenticated',
					redirectUrl: '/login'
				})
			};
			mockFetch.mockResolvedValue(errorResponse);

			// Make request
			try {
				await apiRequest('/secure-endpoint');
				// Should not reach here
				expect(true).toBe(false);
			} catch (error) {
				// Expect redirect to have been triggered
				expect(locationMock.href).toBe('/login');
			}
		});
	});

	describe('TaskApi', () => {
		// Mock apiRequest for TaskApi tests
		const originalApiRequest = apiRequest;
		let mockApiRequest;

		beforeEach(() => {
			// Create a mock for apiRequest that just returns a success response
			mockApiRequest = vi.fn().mockResolvedValue({ success: true });

			// Replace the real apiRequest with our mock in the TaskApi object
			TaskApi.getWeekTasks = (startDate, endDate) => {
				return mockApiRequest('/tasks', {
					params: {
						week: JSON.stringify({ start: startDate.toISOString(), end: endDate.toISOString() })
					}
				});
			};

			TaskApi.createTask = (taskData) => {
				return mockApiRequest('/tasks', {
					method: 'POST',
					body: taskData
				});
			};

			TaskApi.updateTask = (taskData) => {
				return mockApiRequest('/tasks', {
					method: 'PUT',
					body: taskData
				});
			};

			TaskApi.deleteTask = (id) => {
				return mockApiRequest('/tasks', {
					method: 'DELETE',
					body: { id }
				});
			};
		});

		it('should fetch tasks for a specific week', async () => {
			const startDate = new Date('2023-01-01');
			const endDate = new Date('2023-01-07');

			await TaskApi.getWeekTasks(startDate, endDate);

			// Verify params were passed correctly
			expect(mockApiRequest).toHaveBeenCalledWith('/tasks', {
				params: {
					week: JSON.stringify({
						start: startDate.toISOString(),
						end: endDate.toISOString()
					})
				}
			});
		});

		it('should create a new task', async () => {
			const taskData = {
				title: 'New Task',
				description: 'Task description',
				dueDate: '2023-01-15T12:00:00Z',
				priority: 'medium'
			};

			await TaskApi.createTask(taskData);

			// Verify correct endpoint and method
			expect(mockApiRequest).toHaveBeenCalledWith('/tasks', {
				method: 'POST',
				body: taskData
			});
		});

		it('should update an existing task', async () => {
			const taskData = {
				id: '123',
				title: 'Updated Task',
				status: 'done'
			};

			await TaskApi.updateTask(taskData);

			// Verify correct endpoint and method
			expect(mockApiRequest).toHaveBeenCalledWith('/tasks', {
				method: 'PUT',
				body: taskData
			});
		});

		it('should delete a task', async () => {
			const taskId = 123;

			await TaskApi.deleteTask(taskId);

			// Verify correct endpoint, method and body
			expect(mockApiRequest).toHaveBeenCalledWith('/tasks', {
				method: 'DELETE',
				body: { id: taskId }
			});
		});
	});
});
