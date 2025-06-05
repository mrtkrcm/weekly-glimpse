import { z } from 'zod';
import {
	OpenAPIRegistry,
	OpenApiGeneratorV31,
	extendZodWithOpenApi
} from '@asteasolutions/zod-to-openapi';
import {
	tasks,
	user,
	session,
	googleAccounts,
	googleCalendars,
	sharedCalendars,
	calendarMembers
} from '../db/schema';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { TASK_STATUS, TASK_PRIORITY } from '../validation';

// Extend Zod with OpenAPI support
extendZodWithOpenApi(z);

// Generate Zod schemas from Drizzle schema
const taskSelectSchema = createSelectSchema(tasks).openapi('Task', {
	description: 'A task in the system',
	examples: [
		{
			id: '123e4567-e89b-12d3-a456-426614174000',
			title: 'Complete project documentation',
			description: 'Write comprehensive documentation for the API',
			dueDate: '2024-03-20T10:00:00Z',
			priority: 'high',
			status: 'in_progress',
			userId: '123e4567-e89b-12d3-a456-426614174000',
			createdAt: '2024-03-15T08:00:00Z',
			updatedAt: '2024-03-15T08:00:00Z'
		}
	]
});

const taskInsertSchema = createInsertSchema(tasks, {
	title: (schema) =>
		schema.openapi({
			description: 'The title of the task',
			example: 'Complete project documentation'
		}),
	description: (schema) =>
		schema.openapi({
			description: 'A detailed description of the task',
			example: 'Write comprehensive documentation for the API'
		}),
	dueDate: (schema) =>
		schema.openapi({
			description: 'When the task is due',
			example: '2024-03-20T10:00:00Z'
		}),
	priority: (schema) =>
		schema.openapi({
			description: 'The priority level of the task',
			example: 'high'
		}),
	status: (schema) =>
		schema.openapi({
			description: 'The current status of the task',
			example: 'in_progress'
		})
})
	.omit({ id: true, createdAt: true, updatedAt: true })
	.openapi('TaskCreate');

const calendarSelectSchema = createSelectSchema(sharedCalendars).openapi('Calendar', {
	description: 'A shared calendar in the system',
	examples: [
		{
			id: '123e4567-e89b-12d3-a456-426614174000',
			name: 'Team Calendar',
			ownerId: '123e4567-e89b-12d3-a456-426614174000',
			description: 'Calendar for team events and deadlines',
			createdAt: '2024-03-15T08:00:00Z',
			updatedAt: '2024-03-15T08:00:00Z'
		}
	]
});

const calendarInsertSchema = createInsertSchema(sharedCalendars, {
	name: (schema) =>
		schema.openapi({
			description: 'The name of the calendar',
			example: 'Team Calendar'
		}),
	description: (schema) =>
		schema.openapi({
			description: 'A description of the calendar',
			example: 'Calendar for team events and deadlines'
		})
})
	.omit({ id: true, createdAt: true, updatedAt: true })
	.openapi('CalendarCreate');

const calendarMemberSelectSchema = createSelectSchema(calendarMembers).openapi('CalendarMember', {
	description: 'A member of a shared calendar',
	examples: [
		{
			id: '123e4567-e89b-12d3-a456-426614174000',
			calendarId: '123e4567-e89b-12d3-a456-426614174000',
			userId: '123e4567-e89b-12d3-a456-426614174000',
			role: 'editor',
			createdAt: '2024-03-15T08:00:00Z',
			updatedAt: '2024-03-15T08:00:00Z'
		}
	]
});

const calendarMemberInsertSchema = createInsertSchema(calendarMembers, {
	role: (schema) =>
		schema.openapi({
			description: 'The role of the member in the calendar',
			example: 'editor'
		})
})
	.omit({ id: true, createdAt: true, updatedAt: true })
	.openapi('CalendarMemberCreate');

const googleCalendarSelectSchema = createSelectSchema(googleCalendars).openapi('GoogleCalendar', {
	description: 'A connected Google Calendar',
	examples: [
		{
			id: '123e4567-e89b-12d3-a456-426614174000',
			accountId: '123e4567-e89b-12d3-a456-426614174000',
			calendarId: 'primary',
			createdAt: '2024-03-15T08:00:00Z',
			updatedAt: '2024-03-15T08:00:00Z'
		}
	]
});

// Create OpenAPI registry
const registry = new OpenAPIRegistry();

// Register common schemas
// Note: This file is the single source of truth for OpenAPI generation
// The duplicate file at src/lib/server/openapi/generator.ts is deprecated and should be removed
const errorResponseSchema = z
	.object({
		error: z.boolean(),
		message: z.string(),
		details: z.unknown().optional(),
		timestamp: z.string().datetime()
	})
	.openapi('ErrorResponse', {
		description: 'Error response format',
		examples: [
			{
				error: true,
				message: 'Validation failed',
				details: { field: 'title', error: 'Required' },
				timestamp: '2024-03-15T08:00:00Z'
			}
		]
	});

const paginatedResponseSchema = <T extends z.ZodType>(schema: T) =>
	z
		.object({
			data: z.array(schema),
			pagination: z.object({
				page: z.number(),
				limit: z.number(),
				totalItems: z.number(),
				totalPages: z.number()
			})
		})
		.openapi('PaginatedResponse', {
			description: 'Paginated response format',
			examples: [
				{
					data: [],
					pagination: {
						page: 1,
						limit: 20,
						totalItems: 0,
						totalPages: 0
					}
				}
			]
		});

// Common error responses for all routes
const commonErrorResponses = {
	400: {
		description: 'Bad request',
		content: {
			'application/json': {
				schema: errorResponseSchema
			}
		}
	},
	401: {
		description: 'Unauthorized',
		content: {
			'application/json': {
				schema: errorResponseSchema
			}
		}
	},
	403: {
		description: 'Forbidden',
		content: {
			'application/json': {
				schema: errorResponseSchema
			}
		}
	},
	404: {
		description: 'Not found',
		content: {
			'application/json': {
				schema: errorResponseSchema
			}
		}
	},
	500: {
		description: 'Internal server error',
		content: {
			'application/json': {
				schema: errorResponseSchema
			}
		}
	}
};

// Register schemas
registry.register('ErrorResponse', errorResponseSchema);
registry.register('Task', taskSelectSchema);
registry.register('TaskCreate', taskInsertSchema);
registry.register('Calendar', calendarSelectSchema);
registry.register('CalendarCreate', calendarInsertSchema);
registry.register('CalendarMember', calendarMemberSelectSchema);
registry.register('CalendarMemberCreate', calendarMemberInsertSchema);
registry.register('GoogleCalendar', googleCalendarSelectSchema);

// Register routes
registry.registerPath({
	method: 'get',
	path: '/api/tasks',
	description: 'List all tasks for the authenticated user',
	summary: 'List tasks',
	operationId: 'listTasks',
	request: {
		query: z.object({
			status: z
				.enum([TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE])
				.optional()
				.openapi({
					description: 'Filter tasks by status',
					example: TASK_STATUS.IN_PROGRESS
				}),
			priority: z
				.enum([TASK_PRIORITY.LOW, TASK_PRIORITY.MEDIUM, TASK_PRIORITY.HIGH])
				.optional()
				.openapi({
					description: 'Filter tasks by priority',
					example: TASK_PRIORITY.HIGH
				}),
			page: z.number().int().min(1).default(1).openapi({
				description: 'Page number',
				example: 1
			}),
			limit: z.number().int().min(1).max(100).default(20).openapi({
				description: 'Number of items per page',
				example: 20
			})
		})
	},
	responses: {
		200: {
			description: 'List of tasks',
			content: {
				'application/json': {
					schema: paginatedResponseSchema(taskSelectSchema)
				}
			}
		},
		...commonErrorResponses
	}
});

registry.registerPath({
	method: 'post',
	path: '/api/tasks',
	description: 'Create a new task',
	summary: 'Create task',
	operationId: 'createTask',
	request: {
		body: {
			content: {
				'application/json': {
					schema: taskInsertSchema
				}
			}
		}
	},
	responses: {
		201: {
			description: 'Task created successfully',
			content: {
				'application/json': {
					schema: taskSelectSchema
				}
			}
		}
	}
});

// Calendar routes
registry.registerPath({
	method: 'get',
	path: '/api/calendars',
	description: 'List all calendars for the authenticated user',
	summary: 'List calendars',
	operationId: 'listCalendars',
	request: {
		query: z.object({
			page: z.number().int().min(1).default(1).openapi({
				description: 'Page number',
				example: 1
			}),
			limit: z.number().int().min(1).max(100).default(20).openapi({
				description: 'Number of items per page',
				example: 20
			})
		})
	},
	responses: {
		200: {
			description: 'List of calendars',
			content: {
				'application/json': {
					schema: paginatedResponseSchema(calendarSelectSchema)
				}
			}
		},
		...commonErrorResponses
	}
});

registry.registerPath({
	method: 'post',
	path: '/api/calendars',
	description: 'Create a new calendar',
	summary: 'Create calendar',
	operationId: 'createCalendar',
	request: {
		body: {
			content: {
				'application/json': {
					schema: calendarInsertSchema
				}
			}
		}
	},
	responses: {
		201: {
			description: 'Calendar created successfully',
			content: {
				'application/json': {
					schema: calendarSelectSchema
				}
			}
		}
	}
});

// Calendar member routes
registry.registerPath({
	method: 'get',
	path: '/api/calendars/{calendarId}/members',
	description: 'List all members of a calendar',
	summary: 'List calendar members',
	operationId: 'listCalendarMembers',
	request: {
		params: z.object({
			calendarId: z.string().uuid().openapi({
				description: 'The ID of the calendar',
				example: '123e4567-e89b-12d3-a456-426614174000'
			})
		}),
		query: z.object({
			page: z.number().int().min(1).default(1).openapi({
				description: 'Page number',
				example: 1
			}),
			limit: z.number().int().min(1).max(100).default(20).openapi({
				description: 'Number of items per page',
				example: 20
			})
		})
	},
	responses: {
		200: {
			description: 'List of calendar members',
			content: {
				'application/json': {
					schema: paginatedResponseSchema(calendarMemberSelectSchema)
				}
			}
		},
		...commonErrorResponses
	}
});

registry.registerPath({
	method: 'post',
	path: '/api/calendars/{calendarId}/members',
	description: 'Add a member to a calendar',
	summary: 'Add calendar member',
	operationId: 'addCalendarMember',
	request: {
		params: z.object({
			calendarId: z.string().uuid().openapi({
				description: 'The ID of the calendar',
				example: '123e4567-e89b-12d3-a456-426614174000'
			})
		}),
		body: {
			content: {
				'application/json': {
					schema: calendarMemberInsertSchema
				}
			}
		}
	},
	responses: {
		201: {
			description: 'Calendar member added successfully',
			content: {
				'application/json': {
					schema: calendarMemberSelectSchema
				}
			}
		}
	}
});

// Google calendar routes
registry.registerPath({
	method: 'get',
	path: '/api/calendars/google',
	description: 'List all Google calendars',
	summary: 'List Google calendars',
	operationId: 'listGoogleCalendars',
	request: {
		query: z.object({
			page: z.number().int().min(1).default(1).openapi({
				description: 'Page number',
				example: 1
			}),
			limit: z.number().int().min(1).max(100).default(20).openapi({
				description: 'Number of items per page',
				example: 20
			})
		})
	},
	responses: {
		200: {
			description: 'List of Google calendars',
			content: {
				'application/json': {
					schema: paginatedResponseSchema(googleCalendarSelectSchema)
				}
			}
		},
		...commonErrorResponses
	}
});

// Generate OpenAPI document
const generator = new OpenApiGeneratorV31(registry.definitions);

export const openApiDocument = generator.generateDocument({
	openapi: '3.1.0',
	info: {
		title: 'Weekly Glimpse API',
		version: '1.0.0',
		description: 'API for Weekly Glimpse task management and calendar integration'
	},
	servers: [
		{
			url: '/api',
			description: 'API base URL'
		}
	],
	security: [
		{
			sessionAuth: []
		}
	],
	components: {
		securitySchemes: {
			sessionAuth: {
				type: 'apiKey',
				in: 'cookie',
				name: 'auth_session'
			}
		}
	}
});
