import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cache } from '../cache';

// Mock browser storage
const mockStorage = {
	store: new Map<string, string>(),
	length: 0,
	clear() {
		this.store.clear();
		this.length = 0;
	},
	getItem(key: string) {
		return this.store.get(key) || null;
	},
	setItem(key: string, value: string) {
		this.store.set(key, value);
		this.length = this.store.size;
	},
	removeItem(key: string) {
		this.store.delete(key);
		this.length = this.store.size;
	},
	key(index: number) {
		return Array.from(this.store.keys())[index] || null;
	}
};

// Mock browser environment
vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false
}));

// Mock localStorage and sessionStorage
Object.defineProperty(global, 'localStorage', { value: { ...mockStorage } });
Object.defineProperty(global, 'sessionStorage', { value: { ...mockStorage } });

// Mock setInterval for cleanup
vi.spyOn(global, 'setInterval').mockImplementation(() => 1);

describe('CacheService', () => {
	beforeEach(() => {
		localStorage.clear();
		sessionStorage.clear();
		cache.clear();
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	describe('memory cache', () => {
		it('should cache and retrieve values', async () => {
			const fetchFn = vi.fn().mockResolvedValue('test-value');

			const value1 = await cache.get('test-key', fetchFn);
			const value2 = await cache.get('test-key', fetchFn);

			expect(value1).toBe('test-value');
			expect(value2).toBe('test-value');
			expect(fetchFn).toHaveBeenCalledTimes(1);
		});

		it('should respect TTL', async () => {
			const fetchFn = vi.fn().mockResolvedValue('test-value');

			await cache.get('test-key', fetchFn, { ttl: 1000 }); // 1 second TTL

			// Advance time by 2 seconds
			vi.advanceTimersByTime(2000);

			await cache.get('test-key', fetchFn);

			expect(fetchFn).toHaveBeenCalledTimes(2);
		});

		it('should handle cache invalidation', async () => {
			const fetchFn = vi.fn().mockResolvedValue('test-value');

			await cache.get('test-key', fetchFn);
			await cache.invalidate('test-key');
			await cache.get('test-key', fetchFn);

			expect(fetchFn).toHaveBeenCalledTimes(2);
		});
	});

	describe('local storage', () => {
		it('should cache and retrieve values from localStorage', async () => {
			const fetchFn = vi.fn().mockResolvedValue('test-value');

			const value1 = await cache.get('test-key', fetchFn, { storage: 'local' });
			const value2 = await cache.get('test-key', fetchFn, { storage: 'local' });

			expect(value1).toBe('test-value');
			expect(value2).toBe('test-value');
			expect(fetchFn).toHaveBeenCalledTimes(1);
			expect(localStorage.length).toBe(1);
		});

		it('should handle JSON parse errors', async () => {
			const fetchFn = vi.fn().mockResolvedValue('test-value');

			localStorage.setItem('tweek-cache:test-key', 'invalid-json');

			const value = await cache.get('test-key', fetchFn, { storage: 'local' });

			expect(value).toBe('test-value');
			expect(fetchFn).toHaveBeenCalledTimes(1);
		});
	});

	describe('session storage', () => {
		it('should cache and retrieve values from sessionStorage', async () => {
			const fetchFn = vi.fn().mockResolvedValue('test-value');

			const value1 = await cache.get('test-key', fetchFn, { storage: 'session' });
			const value2 = await cache.get('test-key', fetchFn, { storage: 'session' });

			expect(value1).toBe('test-value');
			expect(value2).toBe('test-value');
			expect(fetchFn).toHaveBeenCalledTimes(1);
			expect(sessionStorage.length).toBe(1);
		});
	});

	describe('namespacing', () => {
		it('should handle different namespaces independently', async () => {
			const fetchFn = vi.fn().mockResolvedValue('test-value');

			await cache.get('test-key', fetchFn, { namespace: 'ns1' });
			await cache.get('test-key', fetchFn, { namespace: 'ns2' });

			expect(fetchFn).toHaveBeenCalledTimes(2);
		});

		it('should clear only specified namespace', async () => {
			const fetchFn = vi.fn().mockResolvedValue('test-value');

			await cache.get('test-key', fetchFn, { namespace: 'ns1' });
			await cache.get('test-key', fetchFn, { namespace: 'ns2' });

			await cache.clear('ns1');

			const value1 = await cache.has('test-key', { namespace: 'ns1' });
			const value2 = await cache.has('test-key', { namespace: 'ns2' });

			expect(value1).toBe(false);
			expect(value2).toBe(true);
		});
	});

	describe('error handling', () => {
		it('should handle fetch function errors', async () => {
			const fetchFn = vi.fn().mockRejectedValue(new Error('Fetch error'));

			await expect(cache.get('test-key', fetchFn)).rejects.toThrow('Fetch error');
		});

		it('should handle storage quota exceeded', async () => {
			const fetchFn = vi.fn().mockResolvedValue('test-value');

			// Mock quota exceeded error
			const originalSetItem = localStorage.setItem;
			localStorage.setItem = vi.fn().mockImplementation(() => {
				throw new Error('QuotaExceededError');
			});

			const value = await cache.get('test-key', fetchFn, { storage: 'local' });

			expect(value).toBe('test-value');
			localStorage.setItem = originalSetItem;
		});
	});
});
