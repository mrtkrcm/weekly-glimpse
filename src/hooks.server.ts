import { validateCsrfToken } from '$lib/server/csrf';
import { validateSessionToken } from '$lib/server/auth';
import { initializeMonitoring } from '$lib/server/monitoring';
import { notificationService } from '$lib/server/services/notification';
import { errorHandler } from '$lib/server/services/error-handler';
import { logger } from '$lib/server/services/logger';
import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';

// Initialize monitoring
initializeMonitoring();

// Generate request ID
function generateRequestId(): string {
	return Math.random().toString(36).substring(2, 15);
}

// Single combined handle function
export const handle: Handle = async ({ event, resolve }) => {
	// Generate request ID
	const requestId = generateRequestId();
	const startTime = performance.now();

	// Add request ID to event locals
	event.locals.requestId = requestId;

	// Log request
	logger.info('Incoming request', {
		requestId,
		method: event.request.method,
		url: event.url.pathname,
		query: Object.fromEntries(event.url.searchParams),
		userId: event.locals.user?.id
	});

	try {
		// Check for auth token in cookies/headers and validate
		const sessionCookie = event.cookies.get('auth_session');
		const result = await validateSessionToken(sessionCookie || null);
		if (result.user) {
			event.locals.user = result.user;
			event.locals.session = result.session;
		}

		// CSRF validation for non-GET requests
		if (event.request.method !== 'GET' && event.url.pathname !== '/api/auth/login') {
			const csrfToken = event.request.headers.get('x-csrf-token');
			if (!validateCsrfToken(csrfToken || '', event.locals.user?.id)) {
				return new Response('CSRF token validation failed', { status: 403 });
			}
		}

		// Process the request
		const response = await resolve(event);

		// Log successful response
		const duration = performance.now() - startTime;
		logger.info('Request completed', {
			requestId,
			duration,
			status: response.status
		});

		// Set any new session cookies
		if (result?.cookie) {
			const { name, value, ...attributes } = result.cookie;
			event.cookies.set(name, value, { path: '/', ...attributes });
		}

		return response;
	} catch (error) {
		const duration = performance.now() - startTime;
		const context = {
			requestId: event.locals.requestId,
			userId: event.locals.user?.id,
			url: event.url.pathname,
			method: event.request.method
		};

		// Handle API errors
		if (event.url.pathname.startsWith('/api/')) {
			const appError = errorHandler.handleError(error, context);
			return Response.json(
				{
					error: appError.message,
					code: appError.code,
					...(dev && { details: appError.context })
				},
				{
					status: appError.status
				}
			);
		}

		// Handle page errors
		logger.error('Unhandled error in page route', {
			context,
			error: error instanceof Error ? error : undefined
		});

		return new Response(
			dev
				? `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				: 'Internal Server Error',
			{
				status: 500,
				headers: {
					'Content-Type': 'text/plain'
				}
			}
		);
	}
};
