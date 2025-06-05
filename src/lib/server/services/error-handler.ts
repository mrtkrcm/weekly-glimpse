import { dev } from '$app/environment';
import { logger } from './logger';
import { createAppError, type AppError, ErrorCode } from '../utils/errors';
import type { LogContext } from './logger';

export class ErrorHandler {
	private static instance: ErrorHandler;

	private constructor() {}

	public static getInstance(): ErrorHandler {
		if (!ErrorHandler.instance) {
			ErrorHandler.instance = new ErrorHandler();
		}
		return ErrorHandler.instance;
	}

	/**
	 * Handles an error by logging it and returning an appropriate AppError
	 */
	public handleError(error: unknown, context?: LogContext): AppError {
		let appError: AppError;

		// Convert to AppError if it isn't one already
		if (this.isAppError(error)) {
			appError = error;
		} else {
			appError = this.createAppErrorFromUnknown(error);
		}

		// Log the error with context
		logger.error(appError.message, {
			context: {
				...context,
				errorCode: appError.code,
				errorStatus: appError.status
			},
			error: appError.originalError instanceof Error ? appError.originalError : undefined
		});

		return appError;
	}

	/**
	 * Handles API errors and returns appropriate responses
	 */
	public handleApiError(error: unknown, context?: LogContext): Response {
		const appError = this.handleError(error, context);

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

	/**
	 * Type guard for AppError
	 */
	private isAppError(error: unknown): error is AppError {
		return (
			typeof error === 'object' &&
			error !== null &&
			'code' in error &&
			'status' in error &&
			'message' in error
		);
	}

	/**
	 * Creates an AppError from an unknown error
	 */
	private createAppErrorFromUnknown(error: unknown): AppError {
		if (error instanceof Error) {
			// Handle standard Error objects
			return createAppError(error, ErrorCode.UNKNOWN_ERROR, 500, {
				stack: dev ? error.stack : undefined
			});
		} else if (typeof error === 'string') {
			// Handle string errors
			return createAppError(error, ErrorCode.UNKNOWN_ERROR, 500);
		} else {
			// Handle other types of errors
			return createAppError('An unknown error occurred', ErrorCode.UNKNOWN_ERROR, 500, {
				originalError: error
			});
		}
	}

	/**
	 * Creates a boundary function that catches and handles errors
	 */
	public createErrorBoundary<T>(fn: () => Promise<T>, context?: LogContext): () => Promise<T> {
		return async () => {
			try {
				return await fn();
			} catch (error) {
				throw this.handleError(error, context);
			}
		};
	}
}

export const errorHandler = ErrorHandler.getInstance();
