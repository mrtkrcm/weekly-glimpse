import { z } from 'zod';
import type { Handle } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

// In-memory store for rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Limit each IP to 100 requests per windowMs

// Task schema for input validation
export const taskSchema = z.object({
	title: z.string().min(1).max(100),
	description: z.string().max(1000).optional(),
	dueDate: z.string().datetime().optional(),
	completed: z.boolean().optional(),
	priority: z.enum(['low', 'medium', 'high']).optional()
});

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

// Validate request body against a schema
export async function validateRequest<T>(request: Request, schema: z.Schema<T>): Promise<T> {
	try {
		const body = await request.json();
		return schema.parse(body);
	} catch (err) {
		if (err instanceof z.ZodError) {
			throw error(400, { message: 'Invalid request data', errors: err.errors });
		}
		throw error(400, 'Invalid request data');
	}
}
