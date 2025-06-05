import { db } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';
import { taskSchema, validateRequest } from '$lib/server/middleware';
import { trackPerformance, withErrorBoundary } from '$lib/server/monitoring';
import { json, error, type RequestEvent } from '@sveltejs/kit';
import { and, eq, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { TASK_STATUS, TASK_PRIORITY } from '$lib/server/validation';
import { notificationService } from '$lib/server/services/notification';

/**
 * Authentication helper functions
 */
// Authentication helper with improved error handling
const auth = {
	requireUser: (event: RequestEvent) => {
		if (!event.locals.user) {
			throw error(401, new Error('Please log in to continue'));
		}
		return event.locals.user;
	},

	verifyOwnership: (taskUserId: string, currentUserId: string) => {
		if (taskUserId !== currentUserId) {
			throw error(403, new Error('You can only access your own tasks'));
		}
	}
};

// Standard error response format
function createErrorResponse(status: number, message: string, details?: unknown) {
	return json(
		{
			error: true,
			message,
			details,
			timestamp: new Date().toISOString()
		},
		{ status }
	);
}
// Task interface matching the database schema
import type { TaskInput, TaskOutput } from '$lib/server/middleware';

interface TaskEntity extends Omit<TaskOutput, 'completed'> {
	id: string;
	completed: string;
	createdAt: Date;
	updatedAt: Date;
}

interface TaskResponse extends Omit<TaskEntity, 'completed' | 'dueDate'> {
	completed: boolean;
	dueDate: string;
}

// Improved week parameter validation
const weekParamsSchema = z.object({
	week: z
		.string()
		.transform((str) => {
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
		.refine(({ start, end }) => !isNaN(start.getTime()) && !isNaN(end.getTime()), {
			message: 'Invalid date range'
		})
		.refine(({ start, end }) => end.getTime() > start.getTime(), {
			message: 'End date must be after start date'
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
			const user = auth.requireUser(event);

			// Parse and validate week parameter
			const params = weekParamsSchema.safeParse(Object.fromEntries(event.url.searchParams));

			if (!params.success) {
				return createErrorResponse(400, 'Invalid date range parameters', params.error.errors);
			}

			const weekParam = params.data.week;

			// Get tasks for the current user and date range with performance tracking
			const pageSize = 10; // Configurable page size
			const cursor = event.url.searchParams.get('cursor') || null;

			const userTasks = await trackPerformance('fetchTasks', async () => {
				const foundTasks = await db
					.select()
					.from(tasks)
					.where(
						and(
							eq(tasks.userId, user.id),
							gte(tasks.dueDate, weekParam.start),
							lte(tasks.dueDate, weekParam.end),
							cursor ? lte(tasks.id, cursor) : undefined
						)
					)
					.orderBy(tasks.id)
					.limit(pageSize + 1);

				return foundTasks.map((task) => {
					const response: TaskResponse = {
						...task,
						completed: task.completed,
						dueDate: task.dueDate.toISOString(),
						priority: task.priority as 'normal' | 'low' | 'medium' | 'high'
					};
					return response;
				});
			});

			const hasNextPage = foundTasks.length > pageSize;
			const tasksToReturn = hasNextPage ? foundTasks.slice(0, -1) : foundTasks;

			return json({
				data: tasksToReturn,
				nextCursor: hasNextPage ? tasksToReturn[tasksToReturn.length - 1].id : null,
				message: 'Tasks retrieved successfully'
			});
		} catch (error) {
			console.error('[Task Fetch Error]:', error);

			if (error instanceof z.ZodError) {
				return createErrorResponse(400, 'Validation failed', error.errors);
			}

			if (error instanceof Error && 'status' in error) {
				return createErrorResponse(
					(error as any).status,
					error.message,
					process.env.NODE_ENV === 'development' ? error : undefined
				);
			}

			return createErrorResponse(
				500,
				'Failed to fetch tasks',
				process.env.NODE_ENV === 'development' ? error : undefined
			);
		}
	});
};

/**
 * Creates a new task with improved validation and error handling
 * @async
 * @param {RequestEvent} event - The request event from SvelteKit
 * @returns {Promise<Response>} JSON response with the created task
 */
export const POST = async (event: RequestEvent): Promise<Response> => {
	return withErrorBoundary(async () => {
		try {
			const user = auth.requireUser(event);

			const requestData = await validateRequest(event.request, taskSchema);

			// Ensure user context is properly attached
			const taskData = {
				id: crypto.randomUUID(),
				userId: user.id,
				title: requestData.title,
				description: requestData.description ?? null,
				// Map completed boolean to proper status enum
				status: requestData.completed === 'true' ? TASK_STATUS.DONE : TASK_STATUS.TODO,
				priority: requestData.priority ?? TASK_PRIORITY.NORMAL,
				dueDate: requestData.dueDate ? new Date(String(requestData.dueDate)) : null
			};

			const result = await trackPerformance('createTask', async () => {
				const [task] = await db.insert(tasks).values(taskData).returning();
				return task;
			});

			// Schedule reminder if task has a due date
			if (result.dueDate) {
				await notificationService.scheduleTaskReminder(
					result.id,
					result.userId,
					new Date(result.dueDate)
				);
			}

			// Return standardized success response
			return json({
				data: result,
				message: 'Task created successfully'
			});
		} catch (error) {
			console.error('[Task Creation Error]:', error);

			if (error instanceof z.ZodError) {
				return createErrorResponse(400, 'Validation failed', error.errors);
			}

			if (error instanceof Error && 'status' in error) {
				return createErrorResponse(
					(error as any).status,
					error.message,
					process.env.NODE_ENV === 'development' ? error : undefined
				);
			}

			return createErrorResponse(500, 'Failed to create task');
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
		try {
			const user = auth.requireUser(event);

			// Extend task schema to include ID for updates
			const updateSchema = taskSchema.extend({
				id: z.string()
			});

			const requestData = await validateRequest(event.request, updateSchema);

			// First check if the task exists and validate ownership
			const existingTask = await trackPerformance('fetchTask', async () => {
				const [task] = await db.select().from(tasks).where(eq(tasks.id, requestData.id)).limit(1);
				return task;
			});

			if (!existingTask) {
				return createErrorResponse(404, 'Task not found');
			}

			// Verify ownership
			auth.verifyOwnership((existingTask as any).userId, user.id);

			// Prepare update data with proper type handling
			const updateData = {
				...requestData,
				userId: user.id, // Ensure user context is preserved
				completed: (requestData.completed ?? (existingTask as any).completed === 'true').toString(),
				description: requestData.description ?? (existingTask as any).description,
				priority: requestData.priority ?? (existingTask as any).priority,
				color: requestData.color ?? (existingTask as any).color
			};

			// Remove id from update data
			const { id, ...dataToUpdate } = updateData;

			const result = await trackPerformance('updateTask', async () => {
				const [updated] = await db
					.update(tasks)
					.set({
						...dataToUpdate
					})
					.where(eq(tasks.id, id))
					.returning();
				return updated;
			});

			// Schedule reminder if task has a due date
			if (result.dueDate) {
				await notificationService.scheduleTaskReminder(
					result.id,
					result.userId,
					new Date(result.dueDate)
				);
			}

			return json({
				data: {
					...result,
					dueDate: (result as any).dueDate.toISOString() // Consistent date format in response
				},
				message: 'Task updated successfully'
			});
		} catch (error) {
			console.error('[Task Update Error]:', error);

			if (error instanceof z.ZodError) {
				return createErrorResponse(400, 'Validation failed', error.errors);
			}

			if (error instanceof Error && 'status' in error) {
				return createErrorResponse(
					(error as any).status,
					error.message,
					process.env.NODE_ENV === 'development' ? error : undefined
				);
			}

			return createErrorResponse(
				500,
				'Failed to update task',
				process.env.NODE_ENV === 'development' ? error : undefined
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
		try {
			const user = auth.requireUser(event);

			// Validate delete request schema
			const deleteSchema = z.object({
				id: z.number().int().positive()
			});

			const { id } = await validateRequest(
				event.request,
				z.object({
					id: z.string()
				})
			);

			// Check if task exists and validate ownership
			const existingTask = await trackPerformance('fetchTask', async () => {
				const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
				return task;
			});

			if (!existingTask) {
				return createErrorResponse(404, 'Task not found');
			}

			// Verify ownership
			auth.verifyOwnership((existingTask as any).userId, user.id);
			// Delete task with performance tracking
			const deletedTask = (
				await trackPerformance('deleteTask', async () => {
					return db.delete(tasks).where(eq(tasks.id, id)).returning();
				})
			)[0];

			return json({
				data: { id: deletedTask.id },
				message: 'Task deleted successfully'
			});
		} catch (error) {
			console.error('[Task Deletion Error]:', error);

			if (error instanceof z.ZodError) {
				return createErrorResponse(400, 'Validation failed', error.errors);
			}

			if (error instanceof Error && 'status' in error) {
				return createErrorResponse(
					(error as any).status,
					error.message,
					process.env.NODE_ENV === 'development' ? error : undefined
				);
			}

			return createErrorResponse(
				500,
				'Failed to delete task',
				process.env.NODE_ENV === 'development' ? error : undefined
			);
		}
	});
};
