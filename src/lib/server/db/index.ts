import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { serverConfig } from '$lib/server/config';
import config from '$lib/server/config';

if (!serverConfig.database.url) {
	throw new Error('DATABASE_URL environment variable is required');
}

// Connection configuration with best practices
const connectionConfig = {
	max: 1,
	idle_timeout: 20, // Max idle time in seconds
	connect_timeout: 30, // Connection timeout in seconds
	ssl: serverConfig.database.ssl
};

// Create a singleton connection
const queryClient = postgres(serverConfig.database.url, connectionConfig);

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
