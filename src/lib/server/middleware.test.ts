import { describe, it, expect, vi } from 'vitest';
import { handleRateLimit, validateRequest, taskSchema } from './middleware';
import { error } from '@sveltejs/kit';
import { z } from 'zod';

describe('Middleware', () => {
  describe('handleRateLimit', () => {
    it('should allow requests within the rate limit', async () => {
      const mockEvent = {
        url: { pathname: '/api/test' },
        getClientAddress: () => '127.0.0.1'
      } as any;
      const mockResolve = vi.fn().mockResolvedValue(new Response());

      await handleRateLimit({ event: mockEvent, resolve: mockResolve });
      expect(mockResolve).toHaveBeenCalled();
    });

    it('should throw an error when the rate limit is exceeded', async () => {
      const mockEvent = {
        url: { pathname: '/api/test' },
        getClientAddress: () => '127.0.0.1'
      } as any;
      const mockResolve = vi.fn();

      // Simulate exceeding the rate limit
      for (let i = 0; i < 100; i++) {
        await handleRateLimit({ event: mockEvent, resolve: mockResolve });
      }

      try {
        await handleRateLimit({ event: mockEvent, resolve: mockResolve });
      } catch (err) {
        expect(err.status).toBe(429);
        expect(err.body).toBe('Too Many Requests');
      }
    });

    it('should skip rate limiting for non-API routes', async () => {
      const mockEvent = {
        url: { pathname: '/test' },
        getClientAddress: () => '127.0.0.1'
      } as any;
      const mockResolve = vi.fn().mockResolvedValue(new Response());

      await handleRateLimit({ event: mockEvent, resolve: mockResolve });
      expect(mockResolve).toHaveBeenCalled();
    });
  });

  describe('validateRequest', () => {
    it('should validate a request body against a schema', async () => {
      const mockRequest = {
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ title: 'Test Task', dueDate: new Date() })
      } as any;

      const result = await validateRequest(mockRequest, taskSchema);
      expect(result).toBeDefined();
    });

    it('should throw an error for invalid content type', async () => {
      const mockRequest = {
        headers: { get: () => 'text/html' },
        json: () => Promise.resolve({ title: 'Test Task', dueDate: new Date() })
      } as any;

      try {
        await validateRequest(mockRequest, taskSchema);
      } catch (err) {
        expect(err.status).toBe(415);
      }
    });

    it('should throw an error for invalid JSON', async () => {
      const mockRequest = {
        headers: { get: () => 'application/json' },
        json: () => Promise.reject(new Error('Invalid JSON'))
      } as any;

      try {
        await validateRequest(mockRequest, taskSchema);
      } catch (err) {
        expect(err.status).toBe(400);
      }
    });

    it('should throw an error for schema validation failure', async () => {
      const mockRequest = {
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ title: '', dueDate: new Date() })
      } as any;

      try {
        await validateRequest(mockRequest, taskSchema);
      } catch (err) {
        expect(err.status).toBe(400);
      }
    });
  });
});
