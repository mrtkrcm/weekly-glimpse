import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock browser globals
vi.stubGlobal('navigator', {
	userAgent: 'node.js'
});

// Mock window functions
vi.stubGlobal('requestAnimationFrame', (callback) => setTimeout(callback, 0));
vi.stubGlobal('cancelAnimationFrame', (id) => clearTimeout(id));

// Mock matchMedia
vi.stubGlobal(
	'matchMedia',
	vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
);

// Mock ResizeObserver
vi.stubGlobal(
	'ResizeObserver',
	class {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
);

// Mock IntersectionObserver
vi.stubGlobal(
	'IntersectionObserver',
	class {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
);

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
	default: vi.fn().mockImplementation(() => ({
		on: vi.fn(),
		emit: vi.fn(),
		connect: vi.fn(),
		disconnect: vi.fn()
	}))
}));
