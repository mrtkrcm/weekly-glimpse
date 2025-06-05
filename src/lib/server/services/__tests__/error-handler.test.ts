import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler } from '../error-handler';
import { logger } from '../logger';
import { ErrorCode } from '../../utils/errors';

// Mock the logger
vi.mock('../logger', () => ({
	logger: {
		error: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn()
	}
}));

describe('ErrorHandler', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('handleError', () => {
		it('should handle Error objects', () => {
			const error = new Error('Test error');
			const context = { component: 'test' };

			const appError = errorHandler.handleError(error, context);

			expect(appError.message).toBe('Test error');
			expect(appError.code).toBe(ErrorCode.UNKNOWN_ERROR);
			expect(appError.status).toBe(500);
			expect(logger.error).toHaveBeenCalledWith('Test error', {
				context: {
					component: 'test',
					errorCode: ErrorCode.UNKNOWN_ERROR,
					errorStatus: 500
				},
				error
			});
		});

		it('should handle string errors', () => {
			const error = 'String error';
			const appError = errorHandler.handleError(error);

			expect(appError.message).toBe('String error');
			expect(appError.code).toBe(ErrorCode.UNKNOWN_ERROR);
			expect(appError.status).toBe(500);
			expect(logger.error).toHaveBeenCalled();
		});

		it('should handle unknown error types', () => {
			const error = { custom: 'error' };
			const appError = errorHandler.handleError(error);

			expect(appError.message).toBe('An unknown error occurred');
			expect(appError.code).toBe(ErrorCode.UNKNOWN_ERROR);
			expect(appError.status).toBe(500);
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('handleApiError', () => {
		it('should return a proper Response object', () => {
			const error = new Error('API error');
			const response = errorHandler.handleApiError(error);

			expect(response).toBeInstanceOf(Response);
			expect(response.status).toBe(500);
			expect(response.headers.get('Content-Type')).toBe('application/json');
		});
	});

	describe('createErrorBoundary', () => {
		it('should handle successful operations', async () => {
			const successFn = async () => 'success';
			const boundFn = errorHandler.createErrorBoundary(successFn);

			const result = await boundFn();
			expect(result).toBe('success');
			expect(logger.error).not.toHaveBeenCalled();
		});

		it('should handle errors in wrapped functions', async () => {
			const errorFn = async () => {
				throw new Error('Boundary error');
			};
			const boundFn = errorHandler.createErrorBoundary(errorFn);

			await expect(boundFn()).rejects.toThrow();
			expect(logger.error).toHaveBeenCalled();
		});
	});
});
