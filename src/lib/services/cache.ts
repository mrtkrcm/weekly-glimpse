// Simple browser detection
const isBrowser = typeof window !== 'undefined';

export interface CacheOptions {
	ttl?: number; // Time to live in milliseconds
	storage?: 'memory' | 'local' | 'session';
	namespace?: string;
}

export interface CacheEntry<T> {
	value: T;
	timestamp: number;
	ttl: number;
}

export class CacheService {
	private static instance: CacheService;
	private memoryCache: Map<string, CacheEntry<any>>;
	private readonly DEFAULT_TTL = 3600000; // 1 hour
	private readonly DEFAULT_NAMESPACE = 'tweek-cache';

	private constructor() {
		this.memoryCache = new Map();
		if (isBrowser) {
			this.setupStorageCleanup();
		}
	}

	public static getInstance(): CacheService {
		if (!CacheService.instance) {
			CacheService.instance = new CacheService();
		}
		return CacheService.instance;
	}

	/**
	 * Get a value from cache
	 */
	public async get<T>(
		key: string,
		fetchFn: () => Promise<T>,
		options: CacheOptions = {}
	): Promise<T> {
		const {
			ttl = this.DEFAULT_TTL,
			storage = 'memory',
			namespace = this.DEFAULT_NAMESPACE
		} = options;

		const cacheKey = this.getCacheKey(key, namespace);
		const cached = await this.getFromStorage<T>(cacheKey, storage);

		if (cached && !this.isExpired(cached)) {
			return cached.value;
		}

		const value = await fetchFn();
		await this.set(key, value, { ttl, storage, namespace });
		return value;
	}

	/**
	 * Set a value in cache
	 */
	public async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
		const {
			ttl = this.DEFAULT_TTL,
			storage = 'memory',
			namespace = this.DEFAULT_NAMESPACE
		} = options;

		const entry: CacheEntry<T> = {
			value,
			timestamp: Date.now(),
			ttl
		};

		const cacheKey = this.getCacheKey(key, namespace);
		await this.setInStorage(cacheKey, entry, storage);
	}

	/**
	 * Remove a value from cache
	 */
	public async invalidate(key: string, options: Omit<CacheOptions, 'ttl'> = {}): Promise<void> {
		const { storage = 'memory', namespace = this.DEFAULT_NAMESPACE } = options;
		const cacheKey = this.getCacheKey(key, namespace);

		switch (storage) {
			case 'memory':
				this.memoryCache.delete(cacheKey);
				break;
			case 'local':
				if (isBrowser) localStorage.removeItem(cacheKey);
				break;
			case 'session':
				if (isBrowser) sessionStorage.removeItem(cacheKey);
				break;
		}
	}

	/**
	 * Clear all cache entries
	 */
	public async clear(namespace?: string): Promise<void> {
		// Clear memory cache
		if (namespace) {
			const prefix = this.getCacheKey('', namespace);
			for (const key of this.memoryCache.keys()) {
				if (key.startsWith(prefix)) {
					this.memoryCache.delete(key);
				}
			}
		} else {
			this.memoryCache.clear();
		}

		// Clear storage caches if in browser
		if (isBrowser) {
			if (namespace) {
				const prefix = this.getCacheKey('', namespace);
				this.clearStorageByPrefix(localStorage, prefix);
				this.clearStorageByPrefix(sessionStorage, prefix);
			} else {
				localStorage.clear();
				sessionStorage.clear();
			}
		}
	}

	/**
	 * Check if a cache entry exists and is valid
	 */
	public async has(key: string, options: Omit<CacheOptions, 'ttl'> = {}): Promise<boolean> {
		const { storage = 'memory', namespace = this.DEFAULT_NAMESPACE } = options;
		const cacheKey = this.getCacheKey(key, namespace);
		const entry = await this.getFromStorage(cacheKey, storage);
		return entry !== null && !this.isExpired(entry);
	}

	private getCacheKey(key: string, namespace: string): string {
		return `${namespace}:${key}`;
	}

	private isExpired<T>(entry: CacheEntry<T>): boolean {
		return Date.now() - entry.timestamp > entry.ttl;
	}

	private async getFromStorage<T>(
		key: string,
		storage: CacheOptions['storage']
	): Promise<CacheEntry<T> | null> {
		switch (storage) {
			case 'memory':
				return this.memoryCache.get(key) || null;
			case 'local':
				if (!isBrowser) return null;
				return this.getFromWebStorage<T>(localStorage, key);
			case 'session':
				if (!isBrowser) return null;
				return this.getFromWebStorage<T>(sessionStorage, key);
			default:
				return null;
		}
	}

	private async setInStorage<T>(
		key: string,
		entry: CacheEntry<T>,
		storage: CacheOptions['storage']
	): Promise<void> {
		switch (storage) {
			case 'memory':
				this.memoryCache.set(key, entry);
				break;
			case 'local':
				if (isBrowser) {
					try {
						localStorage.setItem(key, JSON.stringify(entry));
					} catch (error) {
						console.warn('Failed to save to localStorage:', error);
					}
				}
				break;
			case 'session':
				if (isBrowser) {
					try {
						sessionStorage.setItem(key, JSON.stringify(entry));
					} catch (error) {
						console.warn('Failed to save to sessionStorage:', error);
					}
				}
				break;
		}
	}

	private getFromWebStorage<T>(storage: Storage, key: string): CacheEntry<T> | null {
		const item = storage.getItem(key);
		if (!item) return null;

		try {
			return JSON.parse(item);
		} catch {
			storage.removeItem(key);
			return null;
		}
	}

	private clearStorageByPrefix(storage: Storage, prefix: string): void {
		const keys = Object.keys(storage);
		for (const key of keys) {
			if (key.startsWith(prefix)) {
				storage.removeItem(key);
			}
		}
	}

	private setupStorageCleanup(): void {
		// Periodically clean up expired items from storage
		const cleanup = () => {
			const storages = [localStorage, sessionStorage];
			for (const storage of storages) {
				const keys = Object.keys(storage);
				for (const key of keys) {
					if (!key.startsWith(this.DEFAULT_NAMESPACE)) continue;

					const entry = this.getFromWebStorage(storage, key);
					if (entry && this.isExpired(entry)) {
						storage.removeItem(key);
					}
				}
			}
		};

		// Run cleanup every hour
		setInterval(cleanup, this.DEFAULT_TTL);
	}
}

export const cache = CacheService.getInstance();
