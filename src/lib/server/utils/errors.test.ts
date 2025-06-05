import { describe, it, expect, vi } from 'vitest';
import { createAppError, logError, handleApiError, ErrorCode } from './errors';

describe('Error Handling Utilities', () => {
	it('should create an AppError object', () => {
		const error = 'Test error';
		const code = ErrorCode.VALIDATION_ERROR;
		const status = 400;
		const context = { field: 'name' };

		const appError = createAppError(error, code, status, context);

		expect(appError.message).toBe(error);
		expect(appError.code).toBe(code);
		expect(appError.status).toBe(status);
		expect(appError.context).toBe(context);
	});

	it('should create an AppError object with default values', () => {
		const error = 'Test error';

		const appError = createAppError(error);

		expect(appError.message).toBe(error);
		expect(appError.code).toBe(ErrorCode.UNKNOWN_ERROR);
		expect(appError.status).toBe(500);
		expect(appError.originalError).toBe(error);
	});

	it('should log an AppError object', () => {
		const error = createAppError('Test error', ErrorCode.DATABASE_ERROR, 500, {
			query: 'SELECT * FROM users'
		});
		const consoleErrorSpy = vi.spyOn(console, 'error');

		logError(error);

		expect(consoleErrorSpy).toHaveBeenCalled();
	});

	it('should handle an API error and return a Response', () => {
		const error = createAppError('Test error', ErrorCode.UNAUTHORIZED, 401);

		const response = handleApiError(error);

		expect(response).toBeInstanceOf(Response);
		expect(response.status).toBe(401);
	});
});
