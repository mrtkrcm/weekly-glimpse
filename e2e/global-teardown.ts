import type { FullConfig } from '@playwright/test';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
	tasks,
	googleAccounts,
	googleCalendars,
	calendarMembers,
	sharedCalendars
} from '../src/lib/server/db/schema';

async function globalTeardown(config: FullConfig): Promise<void> {
	if (process.env.CI) {
		console.log('Cleaning up CI environment');
	}

	try {
		// Initialize database connection
		const client = postgres(
			'postgres://postgres:mysecretpassword@localhost:5432/weekly_glimpse'
		);
		const db = drizzle(client);

		// Clean up all test data
		// await db.delete(tasks);
		// await db.delete(googleAccounts);
		// await db.delete(googleCalendars);
		// await db.delete(calendarMembers);
		// await db.delete(sharedCalendars);

		// Clean up environment variables
		delete process.env.TEST_USER_EMAIL;
		delete process.env.TEST_USER_PASSWORD;
		delete process.env.TEST_USER_ID;

		await client.end();
		console.log('Test environment cleanup completed successfully');
	} catch (error) {
		console.error('Error cleaning up test environment:', error);
		throw error;
	}
}

export default globalTeardown;
