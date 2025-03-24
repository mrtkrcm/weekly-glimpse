import * as dotenv from 'dotenv';
import type { Config } from 'drizzle-kit';
dotenv.config();

// Default connection URL for development
const defaultDbUrl = 'postgres://postgres:mysecretpassword@localhost:5432/weekly_glimpse';

// Use fallback if environment variable is not available
const dbUrl = process.env.DATABASE_URL || defaultDbUrl;

// console.log('DATABASE_URL (masked):', dbUrl.replace(/:([^@]*)@/, ':***@'));

export default {
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: dbUrl
	}
} satisfies Config;
