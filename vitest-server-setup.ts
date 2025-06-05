import { vi } from 'vitest';

// Mock $app/environment
vi.mock('$app/environment', () => ({
	dev: true,
	browser: false,
	building: false
}));

// Mock console methods for testing
const originalConsole = { ...console };
beforeAll(() => {
	console.debug = vi.fn();
	console.log = vi.fn();
	console.info = vi.fn();
	console.warn = vi.fn();
	console.error = vi.fn();
});

afterAll(() => {
	console.debug = originalConsole.debug;
	console.log = originalConsole.log;
	console.info = originalConsole.info;
	console.warn = originalConsole.warn;
	console.error = originalConsole.error;
});
