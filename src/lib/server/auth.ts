import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { Lucia } from 'lucia';
import { db } from './db';
import { session, user } from './db/schema';
import * as crypto from 'crypto';

const adapter = new DrizzlePostgreSQLAdapter(db, session, user);

export const auth = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: process.env.NODE_ENV === 'production'
		}
	},
	getUserAttributes: (attributes) => {
		return {
			username: attributes.username
		};
	}
});

export const generateSessionToken = (): string => {
	return crypto.randomBytes(32).toString('hex');
};

export const createSession = async (token: string, userId: string) => {
	const session = await auth.createSession({
		userId: userId,
		attributes: {}
	});

	return {
		id: session.id,
		token: token,
		userId: userId,
		expiresAt: session.expiresAt
	};
};

export const validateSessionToken = async (token: string) => {
	try {
		const session = await auth.validateSession(token);
		if (!session) {
			return { session: null, user: null };
		}

		const user = await auth.getUser(session.userId);
		return {
			session: {
				id: session.id,
				token: token,
				userId: session.userId,
				expiresAt: session.expiresAt
			},
			user
		};
	} catch (error) {
		return { session: null, user: null };
	}
};

export const invalidateSession = async (sessionId: string): Promise<void> => {
	await auth.invalidateSession(sessionId);
};

declare module 'lucia' {
	interface Register {
		Lucia: typeof auth;
		DatabaseUserAttributes: {
			username: string;
		};
	}
}
