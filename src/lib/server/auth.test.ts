import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  generateSessionToken,
  createSession,
  validateSessionToken,
  deleteSession,
  auth
} from './auth';

// Mock session data
const mockSession = {
  id: 'mock-session-id-1234',
  token: 'mock-token-5678',
  userId: 'test-user',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  attributes: {}
};

const mockUser = {
  id: 'test-user',
  username: 'testuser'
};

// Mock Lucia auth
const mockLucia = {
  createSession: vi.fn().mockImplementation((userId, attributes = {}) => {
    return Promise.resolve({
      id: mockSession.id,
      userId,
      expiresAt: mockSession.expiresAt,
      attributes,
      fresh: false
    });
  }),
  validateSession: vi.fn().mockImplementation((token) => {
    if (!token) return Promise.resolve(null);
    return Promise.resolve({
      session: {
        id: mockSession.id,
        userId: mockSession.userId,
        expiresAt: mockSession.expiresAt,
        attributes: mockSession.attributes,
        fresh: false
      },
      user: mockUser
    });
  }),
  deleteSession: vi.fn().mockResolvedValue(undefined),
  createSessionCookie: vi.fn().mockReturnValue({
    name: 'auth_session',
    value: 'session_token',
    attributes: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    }
  })
};

// Mock the Lucia constructor
vi.mock('lucia', () => ({
  Lucia: vi.fn().mockReturnValue(mockLucia),
  TimeSpan: {
    activePeriod: 60 * 60 * 24 * 30,
    idlePeriod: 60 * 60 * 24 * 14
  }
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
    const session = await createSession('test-user');
    expect(session).toBeDefined();
    expect(session.id).toBe(mockSession.id);
    expect(session.userId).toBe('test-user');
    expect(mockLucia.createSession).toHaveBeenCalledWith('test-user', {});
  });

  it('validateSessionToken with valid token', async () => {
    const { session, user } = await validateSessionToken(mockSession.token);
    expect(session).toBeDefined();
    expect(session?.id).toBe(mockSession.id);
    expect(user).toBeDefined();
    expect(user?.id).toBe('test-user');
    expect(mockLucia.validateSession).toHaveBeenCalledWith(mockSession.token);
  });

  it('validateSessionToken with null token', async () => {
    const { session, user } = await validateSessionToken(null);
    expect(session).toBeNull();
    expect(user).toBeNull();
    expect(mockLucia.validateSession).not.toHaveBeenCalled();
  });

  it('deleteSession', async () => {
    // Set up mock to return null for deleted session
    mockLucia.validateSession.mockResolvedValueOnce(null);

    await deleteSession(mockSession.id);
    expect(mockLucia.deleteSession).toHaveBeenCalledWith(mockSession.id);

    const { session: validatedSession } = await validateSessionToken(mockSession.token);
    expect(validatedSession).toBeNull();
  });

  it('Session Expiration', async () => {
    mockLucia.validateSession.mockResolvedValueOnce({
      session: null,
      user: null
    });
    const { session, user } = await validateSessionToken(mockSession.token);
    expect(session).toBeNull();
    expect(user).toBeNull();
  });

});
