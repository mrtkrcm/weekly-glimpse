import * as Sentry from '@sentry/node';
// import { env } from '$env/dynamic/private';

// Initialize Sentry with performance monitoring
export function initializeMonitoring() {
	if (process.env.SENTRY_DSN) {
		Sentry.init({
			dsn: process.env.SENTRY_DSN,
			tracesSampleRate: 1.0,
			environment: process.env.NODE_ENV || 'development'
		});
	}
}

// Custom performance monitoring
export function trackPerformance(name: string, fn: () => Promise<any>) {
	return async (...args: Parameters<typeof fn>) => {
		const start = performance.now();
		try {
			const result = await fn(...args);
			const duration = performance.now() - start;

			// Log performance metrics
			Sentry.addBreadcrumb({
				category: 'performance',
				message: `${name} completed`,
				data: { duration, success: true }
			});

			return result;
		} catch (error) {
			const duration = performance.now() - start;

			// Log error with performance context
			Sentry.captureException(error, {
				extra: {
					duration,
					operation: name
				}
			});

			throw error;
		}
	};
}

// Error boundary for API routes
export async function withErrorBoundary(fn: () => Promise<any>) {
	try {
		return await fn();
	} catch (error) {
		Sentry.captureException(error);
		throw error;
	}
}

// Custom transaction monitoring
export function startTransaction(name: string, op: string) {
	if (!process.env.SENTRY_DSN) return undefined;

	let transaction;
	Sentry.startSpan(
		{
			name,
			op
		},
		(span) => {
			transaction = span;
		}
	);

	return transaction;
}

// Utility to track database operations
export function trackDatabaseOperation(operation: string, query: string) {
	const transaction = Sentry.getActiveSpan();
	if (!transaction) return null;

	let dbSpan;
	Sentry.startSpan(
		{
			name: `DB: ${operation}`,
			op: 'db',
			attributes: {
				description: `${operation}: ${query}`
			}
		},
		(span) => {
			dbSpan = span;
		}
	);

	return {
		finish: () => {
			if (dbSpan) {
				dbSpan.end();
			}
		}
	};
}



