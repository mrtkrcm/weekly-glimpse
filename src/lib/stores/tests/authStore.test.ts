import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authStore } from '$lib/stores/authStore';
import type { User } from '$lib/stores/authStore';

// Mock environment modules
vi.mock('$app/environment', () => ({
	browser: true
}));

// Mock fetch for session checking
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		clear: vi.fn(() => {
			store = {};
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		})
	};
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('AuthStore', () => {
	// Mock user data
	const mockUser: User = { id: 'user-123', username: 'testuser' };

	beforeEach(() => {
		// Reset mocks before each test
		vi.clearAllMocks();
		localStorageMock.clear();

		// Mock successful fetch response
		(global.fetch as any).mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockUser)
		});
	});

	afterEach(() => {
		// Ensure we reset the auth state after each test
		// This is important because the store is a singleton
		let unsubscribe: () => void;
		const promise = new Promise<void>((resolve) => {
			unsubscribe = authStore.subscribe(() => {
				resolve();
			});
		});

		authStore.logout();

		return promise.then(() => {
			unsubscribe();
		});
	});

	describe('login', () => {
		it('should update the store with authenticated state and user data', async () => {
			let state: any;
			const unsubscribe = authStore.subscribe((s) => {
				state = s;
			});

			authStore.login(mockUser);

			expect(state.isAuthenticated).toBe(true);
			expect(state.user).toEqual(mockUser);
			expect(state.loading).toBe(false);

			unsubscribe();
		});

		it('should persist the auth state to localStorage', () => {
			authStore.login(mockUser);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'auth',
				JSON.stringify({
					isAuthenticated: true,
					user: mockUser,
					loading: false
				})
			);
		});
	});

	describe('logout', () => {
		it('should update the store with unauthenticated state', async () => {
			// First login to set an authenticated state
			authStore.login(mockUser);

			let state: any;
			const unsubscribe = authStore.subscribe((s) => {
				state = s;
			});

			// Then logout
			authStore.logout();

			expect(state.isAuthenticated).toBe(false);
			expect(state.user).toBeNull();
			expect(state.loading).toBe(false);

			unsubscribe();
		});

		it('should persist the logged out state to localStorage', () => {
			// First login
			authStore.login(mockUser);

			// Clear the mock to only track logout call
			vi.clearAllMocks();

			// Then logout
			authStore.logout();

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'auth',
				JSON.stringify({
					isAuthenticated: false,
					user: null,
					loading: false
				})
			);
		});
	});

	describe('setLoading', () => {
		it('should update the loading state in the store', async () => {
			let state: any;
			const unsubscribe = authStore.subscribe((s) => {
				state = s;
			});

			authStore.setLoading(true);
			expect(state.loading).toBe(true);

			authStore.setLoading(false);
			expect(state.loading).toBe(false);

			unsubscribe();
		});

		it('should persist the loading state to localStorage', () => {
			// Reset mock
			vi.clearAllMocks();

			authStore.setLoading(true);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'auth',
				expect.stringContaining('"loading":true')
			);
		});
	});

	describe('checkSession', () => {
		it('should update the store with authenticated state when session is valid', async () => {
			// Mock successful API response
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockUser)
			});

			let state: any;
			const unsubscribe = authStore.subscribe((s) => {
				state = s;
			});

			await authStore.checkSession();

			expect(global.fetch).toHaveBeenCalledWith('/api/auth/session');
			expect(state.isAuthenticated).toBe(true);
			expect(state.user).toEqual(mockUser);
			expect(state.loading).toBe(false);

			unsubscribe();
		});

		it('should update the store with unauthenticated state when session is invalid', async () => {
			// Mock failed API response
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve({ error: 'Unauthorized' })
			});

			let state: any;
			const unsubscribe = authStore.subscribe((s) => {
				state = s;
			});

			await authStore.checkSession();

			expect(global.fetch).toHaveBeenCalledWith('/api/auth/session');
			expect(state.isAuthenticated).toBe(false);
			expect(state.user).toBeNull();
			expect(state.loading).toBe(false);

			unsubscribe();
		});

		it('should handle network errors gracefully', async () => {
			// Mock network error
			(global.fetch as any).mockRejectedValueOnce(new Error('Network failure'));

			// Spy on console.error
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			let state: any;
			const unsubscribe = authStore.subscribe((s) => {
				state = s;
			});

			await authStore.checkSession();

			expect(consoleErrorSpy).toHaveBeenCalled();
			expect(state.isAuthenticated).toBe(false);
			expect(state.user).toBeNull();
			expect(state.loading).toBe(false);

			consoleErrorSpy.mockRestore();
			unsubscribe();
		});
	});
});
