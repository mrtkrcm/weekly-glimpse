import { Lucia } from 'lucia';
import { serverConfig } from './config';
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from './db';
import { session, user } from './db/schema';

// Initialize Lucia with the Drizzle adapter
const adapter = new DrizzlePostgreSQLAdapter(db, session, user);

export const auth = new Lucia(adapter, {
  getUserAttributes: (data) => {
    return {
      username: data.username
    };
  },
  sessionCookie: {
    attributes: {
      secure: serverConfig.env.isProduction
    }
  },
});

// Type augmentation for Lucia
declare module 'lucia' {
  interface Register {
    Lucia: typeof auth;
    DatabaseUserAttributes: {
      username: string;
    };
  }
}

export type Auth = typeof auth;
