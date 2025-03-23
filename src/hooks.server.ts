import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { handleRateLimit } from '$lib/server/middleware';
import { initServer } from '$lib/server/server';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

// Initialize server if not in build mode
if (!building) {
	initServer((req: any, res: any) => {
		res.writeHead(404);
		res.end('Not found');
	});
}

const handleAuth: Handle = async ({ event, resolve }) => {
	try {
		// Initialize auth state
		event.locals.auth = auth;
		event.locals.user = null;
		event.locals.session = null;

		const sessionId = event.cookies.get(auth.sessionCookieName);
		if (!sessionId) {
			return await resolve(event);
		}

		try {
			const { session, user } = await auth.validateSession(sessionId);

			if (!session) {
				// Invalid session - clear cookie
				event.cookies.delete(auth.sessionCookieName, {
					path: '/'
				});
				return await resolve(event);
			}

			if (session.fresh) {
				// Session was renewed - update cookie
				const sessionCookie = auth.createSessionCookie(session.id);
				event.cookies.set(sessionCookie.name, sessionCookie.value, {
					path: '/',
					...sessionCookie.attributes,
					sameSite: 'lax',
					httpOnly: true
				});
			}

			event.locals.user = user;
			event.locals.session = session;
		} catch (e) {
			// Handle session validation errors
			console.error('Session validation error:', e);
			event.cookies.delete(auth.sessionCookieName, {
				path: '/'
			});
		}

		return await resolve(event);
	} catch (e) {
		// Handle catastrophic errors
		console.error('Auth middleware error:', e);
		return new Response('Internal Server Error', { status: 500 });
	}
};

const handleSecurity: Handle = async ({ event, resolve }) => {
	const start = performance.now();
	const response = await resolve(event);
	const end = performance.now();
	response.headers.set('Server-Timing', `total;dur=${end - start}`);

	// Enhanced security headers
	response.headers.set('X-Frame-Options', 'SAMEORIGIN');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set('X-XSS-Protection', '1; mode=block');
	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: https:",
			"font-src 'self'",
			"connect-src 'self' ws: wss: http: https:",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'"
		].join('; ')
	);

	return response;
};

// Combine middleware using sequence
export const handle = sequence(handleRateLimit, handleAuth, handleSecurity);

// Use middleware function directly instead of auth.handle
export const handleAuthOnly = handleAuth;
