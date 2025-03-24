import { auth } from './lucia';
import * as crypto from 'crypto';

export const generateSessionToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const createSession = async (userId: string) => {
  return await auth.createSession(userId, {});
};

export const validateSessionToken = async (token: string | null) => {
  if (!token) {
    return { session: null, user: null };
  }

  try {
    const validated = await auth.validateSession(token);
    if (!validated) {
      return { session: null, user: null };
    }

    if (validated.session.fresh) {
      // Session was renewed
      const cookie = auth.createSessionCookie(validated.session.id);
      return {
        session: validated.session,
        user: validated.user,
        cookie
      };
    }

    return {
      session: validated.session,
      user: validated.user
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return { session: null, user: null };
  }
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  await auth.invalidateSession(sessionId);
};

export { auth };
