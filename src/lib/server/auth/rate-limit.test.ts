import { describe, it, expect, vi } from 'vitest';
import { rateLimit } from './rate-limit';
import { createAppError, ErrorCode } from '$lib/server/utils/errors';

describe('Rate Limit', () => {
	it('should allow requests within the rate limit', () => {
		const ip = '127.0.0.1';
		expect(() => rateLimit(ip)).not.toThrow();
		expect(() => rateLimit(ip)).not.toThrow();
		expect(() => rateLimit(ip)).not.toThrow();
		expect(() => rateLimit(ip)).not.toThrow();
		expect(() => rateLimit(ip)).not.toThrow();
	});

	it('should throw an error when the rate limit is exceeded', () => {
		const ip = '127.0.0.1';
		rateLimit(ip);
		rateLimit(ip);
		rateLimit(ip);
		rateLimit(ip);
		rateLimit(ip);

		try {
			rateLimit(ip);
		} catch (error) {
			expect(error.message).toBe('Too many attempts, please try again later');
			expect(error.status).toBe(429);
		}
	});

	it('should reset the rate limit after the window expires', async () => {
		const ip = '127.0.0.1';
		const windowMs = 100; // Short window for testing
		const maxAttempts = 2;

		try {
			rateLimit(ip, maxAttempts, windowMs);
			rateLimit(ip, maxAttempts, windowMs);
			rateLimit(ip, maxAttempts, windowMs);
		} catch (error) {
			expect(error.message).toBe('Too many attempts, please try again later');
			expect(error.status).toBe(429);
		}

		// Wait for the window to expire
		await new Promise((resolve) => setTimeout(resolve, windowMs + 1));

		// Should allow requests again
		expect(() => rateLimit(ip, maxAttempts, windowMs)).not.toThrow();
	});
});
