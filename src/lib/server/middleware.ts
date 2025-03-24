import { z } from 'zod';
import type { Handle } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

// In-memory store for rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Limit each IP to 100 requests per windowMs

// Custom error type for validation errors
interface ValidationError {
  path: string;
  message: string;
}

// Import task schema from validation.ts to avoid duplication
import { taskSchema as baseTaskSchema } from './validation';

// Extended task schema with additional fields for the API
export const taskSchema = baseTaskSchema.extend({
  completed: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean()
  ).default(false)
    .transform(val => val.toString()),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format (must be #RRGGBB)")
    .nullable()
}).omit({ status: true }); // Remove status as it's replaced by completed

// Response type for better type safety
export type TaskInput = z.input<typeof taskSchema>;
export type TaskOutput = z.output<typeof taskSchema>;

// Middleware to apply rate limiting to API routes
export const handleRateLimit: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	// Apply rate limiting only to API routes
	if (path.startsWith('/api/')) {
		const ip = event.getClientAddress();
		const now = Date.now();
		const record = rateLimit.get(ip);

		if (!record) {
			// First request from this IP
			rateLimit.set(ip, {
				count: 1,
				resetTime: now + WINDOW_MS
			});
		} else if (now > record.resetTime) {
			// Window has expired, reset the counter
			record.count = 1;
			record.resetTime = now + WINDOW_MS;
		} else if (record.count >= MAX_REQUESTS) {
			// Too many requests
			throw error(429, 'Too Many Requests');
		} else {
			// Increment the counter
			record.count++;
		}

		// Clean up old entries every hour
		if (now % (60 * 60 * 1000) < 1000) {
			for (const [key, value] of rateLimit.entries()) {
				if (now > value.resetTime) {
					rateLimit.delete(key);
				}
			}
		}
	}

	return resolve(event);
};

// Validate request body against a schema with improved error handling
export async function validateRequest<T>(request: Request, schema: z.Schema<T>): Promise<T> {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw error(415, { message: 'Unsupported Media Type: Expected application/json' });
    }

    const body = await request.json().catch(() => {
      throw error(400, { message: 'Invalid JSON in request body' });
    });

    const result = schema.safeParse(body);
    if (!result.success) {
      const errors: ValidationError[] = result.error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      throw error(400, `Validation failed: ${errors.map(e => e.message).join(', ')}`);
    }

    return result.data;
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors: ValidationError[] = err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }));
      throw error(400, {
        message: 'Validation failed',
        errors
      } as any);
    }

    if (err instanceof Error && 'status' in err) {
      throw err;
    }

    throw error(500, {
      message: 'Internal server error during validation'
    });
  }
}
