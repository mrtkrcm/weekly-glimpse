import { z } from 'zod';
import { tasks } from './db/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

/**
 * Consistent enum values used throughout the application
 * These should match the database constraints
 */
export const TASK_STATUS = {
	TODO: 'todo',
	IN_PROGRESS: 'in_progress', // Note: Consistently using underscore for database values
	DONE: 'done'
} as const;

export const TASK_PRIORITY = {
	LOW: 'low',
	MEDIUM: 'medium',
	HIGH: 'high',
	NORMAL: 'normal' // Additional value used in some contexts
} as const;

// Export the generated schemas for reuse in routes
export const taskSelectSchema = createSelectSchema(tasks);
export const taskInsertSchema = createInsertSchema(tasks).omit({
	id: true,
	createdAt: true,
	updatedAt: true
});

// Validation schemas for query parameters
export const taskQuerySchema = z.object({
	status: z.enum([TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE]).optional(),
	priority: z.enum([TASK_PRIORITY.LOW, TASK_PRIORITY.MEDIUM, TASK_PRIORITY.HIGH]).optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20)
});

// Common error response schema
export const errorResponseSchema = z.object({
	error: z.boolean(),
	message: z.string(),
	details: z.unknown().optional(),
	timestamp: z.string().datetime()
});

// Base task schema for validation
export const taskSchema = z.object({
	title: z.string().min(1).max(100),
	description: z.string().max(1000).nullable(),
	dueDate: z.string().datetime().nullable(),
	priority: z
		.enum([TASK_PRIORITY.LOW, TASK_PRIORITY.MEDIUM, TASK_PRIORITY.HIGH, TASK_PRIORITY.NORMAL])
		.default(TASK_PRIORITY.NORMAL),
	status: z.enum([TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE])
});

export function validateTask(data: unknown) {
	return taskSchema.safeParse(data);
}
