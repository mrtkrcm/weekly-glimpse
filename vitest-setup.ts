import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock console.error to avoid noisy test output
console.error = vi.fn();

// Mock environment variables
process.env.VITE_SOCKET_PORT = '4174';
process.env.VITE_SOCKET_HOST = 'localhost';
process.env.SOCKET_PATH = '/socket.io/';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
process.env.EMAIL_SERVICE = 'sendgrid';
process.env.SENDGRID_API_KEY = 'test-key';
process.env.EMAIL_FROM = 'test@example.com';
process.env.EMAIL_REPLY_TO = 'support@example.com';
process.env.NODE_ENV = 'test';

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false
}));
