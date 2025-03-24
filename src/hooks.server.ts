import { sequence } from '@sveltejs/kit/hooks';
import { handleApiError, createAppError, ErrorCode, logError } from '$lib/server/utils/errors';
import { validateCsrfToken } from '$lib/server/csrf';

async function handleErrors({ event, resolve }) {
  try {
    return await resolve(event);
  } catch (error) {
    if (event.url.pathname.startsWith('/api/')) {
      const appError = createAppError(
        error,
        error.code || ErrorCode.UNKNOWN_ERROR,
        error.status || 500
      );
      logError(appError);
      return handleApiError(appError);
    }
    throw error;
  }
}

async function csrfProtection({ event, resolve }) {
  if (
    ['GET', 'HEAD', 'OPTIONS'].includes(event.request.method) ||
    !event.url.pathname.startsWith('/api/')
  ) {
    return await resolve(event);
  }
  const token = event.request.headers.get('x-csrf-token');
  if (!token || !validateCsrfToken(token, event.locals.user?.id)) {
    return new Response(
      JSON.stringify({ error: 'Invalid CSRF token', code: 'csrf_error' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return await resolve(event);
}

export const handle = sequence(handleErrors, csrfProtection);
