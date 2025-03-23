import { FullConfig } from '@playwright/test';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
	users,
	tasks,
	sessions,
	sharedCalendars,
	calendarMembers
} from '../src/lib/server/db/schema';
import { lucia } from '../src/lib/server/auth';

// Test data
const TEST_USER = {
	email: 'test@example.com',
	password: 'testPassword123!'
};

async function globalSetup(config: FullConfig): Promise<void> {
	if (process.env.CI) {
		// CI-specific setup
		console.log('Running in CI environment');
	}

	// Setup test environment
	process.env.NODE_ENV = 'test';

	try {
		// Initialize database connection
		const client = postgres(
			process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/weekly_glimpse'
		);
		const db = drizzle(client);

		// Clean existing test data
		await db.delete(tasks);
		await db.delete(calendarMembers);
		await db.delete(sharedCalendars);
		await db.delete(sessions);
		await db.delete(users);

		// Create test user
		const user = await lucia.createUser({
			key: {
				providerId: 'email',
				providerUserId: TEST_USER.email,
				password: TEST_USER.password
			},
			attributes: {
				email: TEST_USER.email
			}
		});

		// Create test tasks
		const testTasks = [
			{
				title: 'Test Task 1',
				description: 'Description for test task 1',
				dueDate: new Date(),
				completed: false,
				priority: 'high',
				userId: user.userId
			},
			{
				title: 'Test Task 2',
				description: 'Description for test task 2',
				dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
				completed: true,
				priority: 'medium',
				userId: user.userId
			}
		];

		await db.insert(tasks).values(testTasks);

		// Create test shared calendar
		const [calendar] = await db
			.insert(sharedCalendars)
			.values({
				name: 'Test Calendar',
				ownerId: user.userId
			})
			.returning();

		// Add user as admin to the calendar
		await db.insert(calendarMembers).values({
			calendarId: calendar.id,
			userId: user.userId,
			role: 'admin'
		});

		// Store test credentials for tests
		process.env.TEST_USER_EMAIL = TEST_USER.email;
		process.env.TEST_USER_PASSWORD = TEST_USER.password;
		process.env.TEST_USER_ID = user.userId;

		await client.end();
		console.log('Test environment setup completed successfully');
	} catch (error) {
		console.error('Error setting up test environment:', error);
		throw error;
	}
}

export default globalSetup;
