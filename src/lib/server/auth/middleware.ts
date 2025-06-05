import { createAppError, ErrorCode } from '$lib/server/utils/errors';

export function requireAuth({ event, resolve }) {
	if (!event.locals.user) {
		throw createAppError('Unauthorized', ErrorCode.UNAUTHORIZED, 401);
	}
	return resolve(event);
}

export function requireAdmin({ event, resolve }) {
	if (!event.locals.user || event.locals.user.role !== 'admin') {
		throw createAppError('Forbidden', ErrorCode.UNAUTHORIZED, 403);
	}
	return resolve(event);
}
