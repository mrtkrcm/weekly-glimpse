import { describe, it, expect } from 'vitest';
import { generateCsrfToken, validateCsrfToken } from './csrf';

describe('CSRF Protection', () => {
  it('should generate a dummy CSRF token', () => {
    const userId = 'user-1';
    const token = generateCsrfToken(userId);
    expect(token).toBe('dummy-token');
  });

  it('should validate a correct dummy CSRF token', () => {
    const token = 'dummy-token';
    const isValid = validateCsrfToken(token);
    expect(isValid).toBe(true);
  });

  it('should invalidate an incorrect dummy CSRF token', () => {
    const token = 'wrong-token';
    const isValid = validateCsrfToken(token);
    expect(isValid).toBe(false);
  });
});
