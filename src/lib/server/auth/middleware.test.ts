import { describe, it, expect, vi } from 'vitest';
import { requireAuth, requireAdmin } from './middleware';
import { createAppError, ErrorCode } from '$lib/server/utils/errors';

describe('Auth Middleware', () => {
	it('requireAuth should resolve if user is authenticated', async () => {
		const mockEvent = {
			locals: {
				user: { id: 'user-1' }
			}
		} as any;
		const mockResolve = vi.fn().mockResolvedValue(new Response());

		await requireAuth({ event: mockEvent, resolve: mockResolve });

		expect(mockResolve).toHaveBeenCalledWith(mockEvent);
	});

	it('requireAuth should throw UNAUTHORIZED error if user is not authenticated', async () => {
		const mockEvent = {
			locals: {}
		} as any;
		const mockResolve = vi.fn();

		try {
			await requireAuth({ event: mockEvent, resolve: mockResolve });
		} catch (error) {
			expect(error.message).toBe('Unauthorized');
			expect(error.status).toBe(401);
		}

		expect(mockResolve).not.toHaveBeenCalled();
	});

	it('requireAdmin should resolve if user is an admin', async () => {
		const mockEvent = {
			locals: {
				user: { id: 'user-1', role: 'admin' }
			}
		} as any;
		const mockResolve = vi.fn().mockResolvedValue(new Response());

		await requireAdmin({ event: mockEvent, resolve: mockResolve });

		expect(mockResolve).toHaveBeenCalledWith(mockEvent);
	});

	it('requireAdmin should throw UNAUTHORIZED error if user is not an admin', async () => {
		const mockEvent = {
			locals: {
				user: { id: 'user-1', role: 'user' }
			}
		} as any;
		const mockResolve = vi.fn();

		try {
			await requireAdmin({ event: mockEvent, resolve: mockResolve });
		} catch (error) {
			expect(error.message).toBe('Forbidden');
			expect(error.status).toBe(403);
		}

		expect(mockResolve).not.toHaveBeenCalled();
	});

	it('requireAdmin should throw UNAUTHORIZED error if user is not authenticated', async () => {
		const mockEvent = {
			locals: {}
		} as any;
		const mockResolve = vi.fn();

		try {
			await requireAdmin({ event: mockEvent, resolve: mockResolve });
		} catch (error) {
			expect(error.message).toBe('Forbidden');
			expect(error.status).toBe(403);
		}

		expect(mockResolve).not.toHaveBeenCalled();
	});
});
