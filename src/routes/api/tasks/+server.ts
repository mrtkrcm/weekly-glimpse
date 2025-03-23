import { db } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';
import { taskSchema, validateRequest } from '$lib/server/middleware';
import { trackPerformance, withErrorBoundary } from '$lib/server/monitoring';
import { json, type RequestEvent } from '@sveltejs/kit';
import { and, eq, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

/**
 * Authentication helper functions
 */
const auth = {
	requireUser: (event: RequestEvent) => {
		if (!event.locals.user) {
			throw {
				status: 401,
				error: 'Unauthorized',
				message: 'Please log in to continue',
				redirectUrl: '/demo/lucia/login'
			};
		}
		return event.locals.user;
	},

	verifyOwnership: (taskUserId: number, currentUserId: number) => {
		if (taskUserId !== currentUserId) {
			throw {
				status: 403,
				error: 'Forbidden',
				message: 'You can only access your own tasks'
			};
		}
	}
};
interface Task {
	id: number;
	title: string;
	description: string | null;
	dueDate: Date;
	completed: boolean;
	priority: ('low' | 'medium' | 'high') | null;
	userId: number;
	color: string | null;
}

const weekParamsSchema = z.object({
	week: z.string().transform((str) => {
		try {
			const parsed = JSON.parse(str);
			return {
				start: new Date(parsed.start),
				end: new Date(parsed.end)
			};
		} catch (e) {
			throw new Error('Invalid week parameter format');
		}
	})
});

/**
 * Retrieves tasks for a specific time period
 * @async
 * @param {RequestEvent} event - The request event from SvelteKit
 * @returns {Promise<Response>} JSON response with the list of tasks
 * @throws {Error} If the task retrieval fails
 */
export const GET = async (event: RequestEvent): Promise<Response> => {
	return withErrorBoundary(async () => {
		try {
			// Validate authentication first
			const user = auth.requireUser(event);

			// Parse week parameter safely
			let weekParam: { start: Date; end: Date };
			try {
				const params = weekParamsSchema.parse(Object.fromEntries(event.url.searchParams));
				weekParam = params.week;
			} catch (error) {
				return json(
					{
						error: 'Invalid parameters',
						message: 'Please provide valid start and end dates for the week',
						details: error instanceof Error ? error.message : undefined
					},
					{ status: 400 }
				);
			}

			const userId = user.id;

			// Get tasks for the current user and date range
			const userTasks = await db
				.select()
				.from(tasks)
				.where(
					and(
						eq(tasks.userId, userId),
						gte(tasks.dueDate, weekParam.start),
						lte(tasks.dueDate, weekParam.end)
					)
				);

			return json(userTasks);
		} catch (error) {
			console.error('Error fetching tasks:', error);

			// Handle known error types
			if (error && typeof error === 'object' && 'status' in error) {
				return json(
					{
						error: error.error,
						message: error.message,
						redirectUrl: 'redirectUrl' in error ? error.redirectUrl : undefined
					},
					{ status: error.status as number }
				);
			}

			// Handle unexpected errors
			return json(
				{
					error: 'ServerError',
					message: 'An unexpected error occurred while fetching tasks. Please try again later.',
					requestId: crypto.randomUUID() // For error tracking
				},
				{ status: 500 }
			);
		}
	});
};

/**
 * Creates a new task
 * @async
 * @param {RequestEvent} event - The request event from SvelteKit
 * @returns {Promise<Response>} JSON response with the created task
 * @throws {Error} If the task creation fails
 */
export const POST = async (event: RequestEvent): Promise<Response> => {
	return withErrorBoundary(async () => {
		// Check authentication first
		if (!event.locals.user) {
			return json(
				{ error: 'Unauthorized', message: 'You must be logged in to create tasks' },
				{ status: 401 }
			);
		}

		try {
			const requestData = await validateRequest(event.request, taskSchema);

			// Transform dueDate from string to Date if needed
			const data = {
				...requestData,
				dueDate: requestData.dueDate ? new Date(requestData.dueDate) : new Date(),
				userId: event.locals.user.id // Use non-optional user ID
			};

			const result = await trackPerformance('createTask', () =>
				db.insert(tasks).values(data).returning()
			);
			console.log('Task created successfully:', result);
			return json(result);
		} catch (error) {
			console.error('Error creating task:', error);
			return json(
				{
					error: 'Invalid task data',
					message: error instanceof Error ? error.message : 'Task validation failed'
				},
				{ status: 400 }
			);
		}
	});
};

/**
 * Updates an existing task
 * @async
 * @param {RequestEvent} event - The request event from SvelteKit
 * @returns {Promise<Response>} JSON response with the updated task
 * @throws {Error} If the task update fails
 */
export const PUT = async (event: RequestEvent): Promise<Response> => {
	return withErrorBoundary(async () => {
		// Check authentication first
		if (!event.locals.user) {
			return json(
				{ error: 'Unauthorized', message: 'You must be logged in to update tasks' },
				{ status: 401 }
			);
		}

		try {
			// Use a separate schema for update that includes id
			const updateSchema = z.object({
				id: z.number(),
				title: z.string().optional(),
				description: z.string().nullable().optional(),
				dueDate: z.string().optional(),
				completed: z.boolean().optional(),
				priority: z.enum(['low', 'medium', 'high']).nullable().optional()
			});

			const requestData = await validateRequest(event.request, updateSchema);

			// First check if the task belongs to the current user
			const existingTask = await db
				.select()
				.from(tasks)
				.where(eq(tasks.id, requestData.id))
				.limit(1);

			if (!existingTask.length) {
				return json({ error: 'Not found', message: 'Task not found' }, { status: 404 });
			}

			if (existingTask[0].userId !== event.locals.user.id) {
				return json(
					{ error: 'Forbidden', message: 'You can only update your own tasks' },
					{ status: 403 }
				);
			}

			// Transform data to match database schema
			const updateData: Partial<Task> = {
				...requestData,
				// Convert string date to Date object if present
				...(requestData.dueDate && { dueDate: new Date(requestData.dueDate) })
			};

			// Remove id from the update data
			const { id, ...dataToUpdate } = updateData;

			const result = await trackPerformance('updateTask', () =>
				db.update(tasks).set(dataToUpdate).where(eq(tasks.id, id)).returning()
			);
			console.log('Task updated successfully:', result);
			return json(result);
		} catch (error) {
			console.error('Error updating task:', error);
			return json(
				{
					error: 'Invalid update data',
					message: error instanceof Error ? error.message : 'Task update failed'
				},
				{ status: 400 }
			);
		}
	});
};

/**
 * Deletes a task
 * @async
 * @param {RequestEvent} event - The request event from SvelteKit
 * @returns {Promise<Response>} JSON response with the deleted task ID
 * @throws {Error} If the task deletion fails
 */
export const DELETE = async (event: RequestEvent): Promise<Response> => {
	return withErrorBoundary(async () => {
		// Check authentication first
		if (!event.locals.user) {
			return json(
				{ error: 'Unauthorized', message: 'You must be logged in to delete tasks' },
				{ status: 401 }
			);
		}

		try {
			const { id } = await validateRequest(
				event.request,
				z.object({
					id: z.number()
				})
			);

			// First check if the task belongs to the current user
			const existingTask = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);

			if (!existingTask.length) {
				return json({ error: 'Not found', message: 'Task not found' }, { status: 404 });
			}

			if (existingTask[0].userId !== event.locals.user.id) {
				return json(
					{ error: 'Forbidden', message: 'You can only delete your own tasks' },
					{ status: 403 }
				);
			}

			const result = await trackPerformance('deleteTask', () =>
				db.delete(tasks).where(eq(tasks.id, id)).returning()
			);
			console.log('Task deleted successfully:', result);
			return json(result);
		} catch (error) {
			console.error('Error deleting task:', error);
			return json(
				{
					error: 'Invalid request',
					message: error instanceof Error ? error.message : 'Task deletion failed'
				},
				{ status: 400 }
			);
		}
	});
};
