import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error('DATABASE_URL environment variable is not set. Please set it in your .env file.');
}
const db = drizzle(process.env.DATABASE_URL!);

export default {
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		connectionString: process.env.DATABASE_URL ?? ''
	}
} satisfies Config;
