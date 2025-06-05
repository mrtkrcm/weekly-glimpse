export enum ErrorCode {
	UNAUTHORIZED = 'unauthorized',
	NOT_FOUND = 'not_found',
	VALIDATION_ERROR = 'validation_error',
	DATABASE_ERROR = 'database_error',
	UNKNOWN_ERROR = 'unknown_error'
}

export interface AppError {
	message: string;
	code: ErrorCode;
	status: number;
	originalError?: unknown;
	context?: Record<string, unknown>;
}

export function createAppError(
	error: unknown,
	code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
	status: number = 500,
	context?: Record<string, unknown>
): AppError {
	const message = error instanceof Error ? error.message : String(error);
	return {
		message,
		code,
		status,
		originalError: error,
		context
	};
}

export function logError(error: AppError): void {
	console.error(
		JSON.stringify({
			message: error.message,
			code: error.code,
			status: error.status,
			context: error.context,
			stack: error.originalError instanceof Error ? error.originalError.stack : undefined
		})
	);
}

export function handleApiError(error: AppError): Response {
	return new Response(JSON.stringify({ error: error.message, code: error.code }), {
		status: error.status,
		headers: { 'Content-Type': 'application/json' }
	});
}
