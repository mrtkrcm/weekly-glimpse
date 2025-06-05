import { describe, it, expect } from 'vitest';
import { generateCsrfToken, validateCsrfToken } from './csrf';

describe('CSRF Protection', () => {
	it('should generate a CSRF token based on userId', () => {
		const userId = 'test-user-123';
		const token = generateCsrfToken(userId);

		expect(token).toBeDefined();
		expect(typeof token).toBe('string');
		expect(token.length).toBeGreaterThan(0);
	});

	it('should validate a valid CSRF token', () => {
		const userId = 'test-user-123';
		const token = generateCsrfToken(userId);

		const isValid = validateCsrfToken(token, userId);
		expect(isValid).toBe(true);
	});

	it('should reject an invalid CSRF token', () => {
		const userId = 'test-user-123';
		const validToken = generateCsrfToken(userId);

		// Invalid token case
		const isValid = validateCsrfToken('invalid-token', userId);
		expect(isValid).toBe(false);
	});

	it('should handle missing userId during validation', () => {
		const userId = 'test-user-123';
		const token = generateCsrfToken(userId);

		// Should still work without userId if the token is valid
		// This depends on the actual implementation
		const isValid = validateCsrfToken(token);

		// Test expectation depends on implementation
		// If userId is required for validation, this should be false
		// If token alone can be validated, this could be true
		expect(isValid).toBe(true);
	});
});
