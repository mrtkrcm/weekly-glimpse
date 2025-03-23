/**
 * Client-side API utilities for making requests to the Weekly Glimpse API
 */

const API_BASE = '/api';

interface ApiOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
	body?: any;
	headers?: Record<string, string>;
	params?: Record<string, string>;
}

interface ApiError {
	error: string;
	message: string;
	status?: number;
}

/**
 * Makes an API request with proper error handling
 * @param endpoint - API endpoint path (without /api prefix)
 * @param options - Request options
 * @returns Response data from the API
 * @throws ApiError if the request fails
 */
export async function apiRequest<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
	const { method = 'GET', body, headers = {}, params = {} } = options;

	// Prepare URL with query parameters
	const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);

	// Add all parameters
	Object.entries(params).forEach(([key, value]) => {
		url.searchParams.append(key, value);
	});

	// Prepare request options
	const requestOptions: RequestInit = {
		method,
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			...headers
		},
		credentials: 'same-origin'
	};

	// Add body for non-GET requests
	if (body && method !== 'GET') {
		requestOptions.body = JSON.stringify(body);
	}

	try {
		const response = await fetch(url.toString(), requestOptions);

		// Parse response as JSON
		const data = await response.json();

		// Handle API errors (non-2xx status codes)
		if (!response.ok) {
			const error = {
				error: data.error || 'Unknown error',
				message: data.message || 'Something went wrong',
				status: response.status,
				...(data.redirectUrl && { redirectUrl: data.redirectUrl })
			};

			// Handle authentication errors
			if (response.status === 401 && error.redirectUrl) {
				window.location.href = error.redirectUrl;
			}

			throw error;
		}

		return data as T;
	} catch (error) {
		console.error('API request failed:', error);

		// Rethrow as a standardized API error
		if ((error as ApiError).error) {
			throw error;
		} else {
			throw {
				error: 'NetworkError',
				message: 'Failed to connect to the server',
				status: 0
			};
		}
	}
}

/**
 * Task API endpoints
 */
export const TaskApi = {
	/**
	 * Get tasks for a specific week
	 * @param startDate Week start date
	 * @param endDate Week end date
	 * @param useMock Whether to use mock data
	 * @returns List of tasks
	 */
	getWeekTasks: (startDate: Date, endDate: Date) => {
		return apiRequest('/tasks', {
			params: {
				week: JSON.stringify({ start: startDate.toISOString(), end: endDate.toISOString() })
			}
		});
	},

	/**
	 * Create a new task
	 * @param taskData Task data
	 * @returns Created task
	 */
	createTask: (taskData: any) => {
		return apiRequest('/tasks', {
			method: 'POST',
			body: taskData
		});
	},

	/**
	 * Update an existing task
	 * @param taskData Task data with ID
	 * @returns Updated task
	 */
	updateTask: (taskData: any) => {
		return apiRequest('/tasks', {
			method: 'PUT',
			body: taskData
		});
	},

	/**
	 * Delete a task
	 * @param id Task ID
	 * @returns Deleted task
	 */
	deleteTask: (id: number) => {
		return apiRequest('/tasks', {
			method: 'DELETE',
			body: { id }
		});
	}
};
