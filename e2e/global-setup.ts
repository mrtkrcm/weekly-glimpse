import * as dotenv from 'dotenv';
dotenv.config();

import type { FullConfig } from '@playwright/test';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { tasks } from '../src/lib/server/db/schema';
import { auth } from '../src/lib/server/auth';
import * as crypto from 'crypto';
import { hash } from '@node-rs/argon2';

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
      'postgres://postgres:mysecretpassword@localhost:5432/weekly_glimpse'
    );
    const db = drizzle(client);

    // Clean existing test data
    // await db.delete(tasks);

    // Create test user
    const hashedPassword = await hash(TEST_USER.password);
    const userId = crypto.randomUUID();
    // await db.insert(user).values({
    //   id: userId,
    //   username: TEST_USER.email,
    //   passwordHash: hashedPassword,
    // });

    // Create test tasks
    const testTasks = [
      {
        id: crypto.randomUUID(),
        title: 'Test Task 1',
        description: 'Description for test task 1',
        dueDate: new Date(),
        completed: false,
        priority: 'high',
        userId: userId
      },
      {
        id: crypto.randomUUID(),
        title: 'Test Task 2',
        description: 'Description for test task 2',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        completed: true,
        priority: 'medium',
        userId: userId
      }
    ];

    // await db.insert(tasks).values(testTasks);

    // Store test credentials for tests
    process.env.TEST_USER_EMAIL = TEST_USER.email;
    process.env.TEST_USER_PASSWORD = TEST_USER.password;
    process.env.TEST_USER_ID = userId;

    await client.end();
    console.log('Test environment setup completed successfully');
  } catch (error) {
    console.error('Error setting up test environment:', error);
    throw error;
  }
}

export default globalSetup;
