import { vi } from 'vitest';

// Mock environment variables
const mockEnv = {
	DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
	SENTRY_DSN: 'https://test@test.ingest.sentry.io/test',
	GOOGLE_CLIENT_ID: 'test-client-id',
	GOOGLE_CLIENT_SECRET: 'test-client-secret',
	AUTH_SECRET: 'test-auth-secret',
	NODE_ENV: 'test',
	ORIGIN: 'http://localhost:5173'
};

// Mock $env/dynamic/private module
vi.mock('$env/dynamic/private', () => ({
	env: mockEnv
}));

// Mock database
vi.mock('$lib/server/db', () => ({
	db: {
		query: vi.fn(),
		transaction: vi.fn()
	}
}));

// Mock Sentry
vi.mock('@sentry/node', () => ({
	init: vi.fn(),
	captureException: vi.fn(),
	setUser: vi.fn(),
	setTag: vi.fn()
}));
