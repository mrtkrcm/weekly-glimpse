import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn()
};
global.localStorage = localStorageMock;

// Mock IndexedDB
const indexedDB = {
	open: vi.fn(),
	deleteDatabase: vi.fn()
};
global.indexedDB = indexedDB as any;

// Mock fetch
global.fetch = vi.fn();

// Reset all mocks before each test
beforeEach(() => {
	vi.clearAllMocks();
	localStorage.clear();
});
