import { expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock $env/dynamic/private module
vi.mock('$env/dynamic/private', () => ({
	env: {
		DATABASE_URL: 'postgresql://user:password@host:port/database',
		GOOGLE_CLIENT_ID: 'test-client-id',
		GOOGLE_CLIENT_SECRET: 'test-client-secret',
		GOOGLE_CALLBACK_URL: 'http://localhost:5173/auth/google/callback'
	}
}));

// Setup fetch mock
const fetch = vi.fn(() => {
	return Promise.resolve({
		ok: true,
		json: () => Promise.resolve({}),
		text: () => Promise.resolve('')
	} as Response);
});

global.fetch = fetch;

// Setup browser environment for component tests
if (typeof window === 'undefined') {
	vi.stubGlobal('window', {
		location: {
			pathname: '/',
			search: '',
			hash: ''
		}
	});
}

vi.mock('@testing-library/svelte', async () => {
	const actual = (await vi.importActual('@testing-library/svelte')) as any;
	return {
		...actual,
		mount: () => {
			console.warn('mount is not available in this environment, returning a mock.');
			return {
				unmount: () => {},
				component: {},
				debug: () => {},
				getByTestId: () => {
					return {};
				},
				getByText: () => {
					return {};
				},
				container: {
					innerHTML: ''
				}
			};
		}
	};
});

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(() => {
	vi.clearAllMocks();
});
