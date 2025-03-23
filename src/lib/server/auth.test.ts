import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
	generateSessionToken,
	createSession,
	validateSessionToken,
	invalidateSession,
	auth
} from './auth';

// Mock session data
const mockSession = {
	id: 'mock-session-id-1234',
	token: 'mock-token-5678',
	userId: 'test-user',
	expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
};

const mockUser = {
	id: 'test-user',
	username: 'testuser'
};

// Mock Lucia auth
const mockLucia = {
	createSession: vi.fn().mockResolvedValue({
		id: mockSession.id,
		userId: mockSession.userId,
		expiresAt: mockSession.expiresAt,
		attributes: {}
	}),
	validateSession: vi.fn().mockResolvedValue({
		id: mockSession.id,
		userId: mockSession.userId,
		expiresAt: mockSession.expiresAt,
		fresh: false
	}),
	invalidateSession: vi.fn().mockResolvedValue(undefined),
	getUser: vi.fn().mockResolvedValue(mockUser)
};

// Mock the Lucia constructor
vi.mock('lucia', () => ({
	Lucia: vi.fn().mockReturnValue(mockLucia)
}));

describe('Auth Module', () => {
	beforeAll(() => {
		// Ensure Lucia mock is properly initialized
		vi.clearAllMocks();
	});

	afterAll(() => {
		vi.restoreAllMocks();
	});

	it('generateSessionToken', () => {
		const token = generateSessionToken();
		expect(token).toBeDefined();
		expect(typeof token).toBe('string');
		expect(token.length).toBeGreaterThan(0);
	});

	it('createSession', async () => {
		const session = await createSession(mockSession.token, 'test-user');
		expect(session).toBeDefined();
		expect(session.id).toBe(mockSession.id);
		expect(session.userId).toBe('test-user');
		expect(mockLucia.createSession).toHaveBeenCalledWith({
			userId: 'test-user',
			attributes: {}
		});
	});

	it('validateSessionToken', async () => {
		const { session: validatedSession, user } = await validateSessionToken(mockSession.token);
		expect(validatedSession).toBeDefined();
		expect(validatedSession?.id).toBe(mockSession.id);
		expect(user).toBeDefined();
		expect(user?.id).toBe('test-user');
		expect(mockLucia.validateSession).toHaveBeenCalledWith(mockSession.token);
	});

	it('invalidateSession', async () => {
		// Set up mock to return null for invalidated session
		mockLucia.validateSession.mockResolvedValueOnce(null);

		await invalidateSession(mockSession.id);
		expect(mockLucia.invalidateSession).toHaveBeenCalledWith(mockSession.id);

		const { session: validatedSession } = await validateSessionToken(mockSession.token);
		expect(validatedSession).toBeNull();
	});

	it('Session Expiration', async () => {
		mockLucia.validateSession.mockResolvedValueOnce(null);
		const { session: validatedSession } = await validateSessionToken(mockSession.token);
		expect(validatedSession).toBeNull();
	});

	it('Session Renewal', async () => {
		const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
		mockLucia.validateSession.mockResolvedValueOnce({
			id: mockSession.id,
			userId: mockSession.userId,
			expiresAt: futureDate,
			fresh: true
		});

		const { session: validatedSession } = await validateSessionToken(mockSession.token);
		expect(validatedSession).toBeDefined();
		expect(validatedSession?.expiresAt.getTime()).toBeGreaterThan(Date.now());
	});
});
