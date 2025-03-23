import type { Session, User } from 'lucia';

declare global {
	namespace App {
		interface Locals {
			auth: import('lucia').AuthRequest;
			user: User | null;
			session: Session | null;
		}
		// interface Error {}
		// interface PageData {}
		// interface Platform {}
	}

	namespace Lucia {
		type Auth = import('$lib/server/lucia').Auth;
		type DatabaseUserAttributes = {
			username: string;
			created_at?: Date;
		};
		type DatabaseSessionAttributes = Record<string, never>;
	}
}

export {};
