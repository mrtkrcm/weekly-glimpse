import { Lucia } from 'lucia';
import { dev } from '$app/environment';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { auth_user, user_session } from './db/schema';

// Initialize Lucia with the Drizzle adapter
export const auth = new Lucia(new DrizzlePostgreSQLAdapter(db, user_session, auth_user), {
	env: dev ? 'DEV' : 'PROD',
	middleware: 'sveltekit',
	sessionCookie: {
		attributes: {
			secure: !dev
		}
	},
	getUserAttributes: (data) => {
		return {
			username: data.username
		};
	}
});

// Type declarations for Lucia
declare module 'lucia' {
	interface Register {
		Lucia: typeof auth;
		DatabaseUserAttributes: {
			username: string;
		};
	}
}

export type Auth = typeof auth;
