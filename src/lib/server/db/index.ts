import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { serverConfig } from '$lib/server/config';
import * as dotenv from 'dotenv';

// Load environment variables explicitly
dotenv.config();

// Debug logging
// console.log('Database connection - environment check:');
// console.log('DATABASE_URL in process.env:', !!process.env.DATABASE_URL);
// console.log('DATABASE_URL in serverConfig:', !!serverConfig.database.url);

// Use fallback if environment variable is not available
const dbUrl = serverConfig.database.url;

// Log connection info without credentials
// const maskedUrl = dbUrl.replace(/:([^@]*)@/, ':***@');
// console.log('Using database URL:', maskedUrl);

// Connection configuration with best practices
const connectionConfig = {
	max: 1,
	idle_timeout: 20, // Max idle time in seconds
	connect_timeout: 30, // Connection timeout in seconds
	ssl: serverConfig.database.ssl
};

// Create a singleton connection
const queryClient = postgres(dbUrl, connectionConfig);

// Create the database instance with schema
export const db = drizzle(queryClient, {
	schema,
	logger: serverConfig.database.logger
});

// Health check function
export const checkDatabaseConnection = async () => {
	try {
		await queryClient`SELECT 1`;
		return true;
	} catch (error) {
		console.error('Database health check failed:', error);
		return false;
	}
};
