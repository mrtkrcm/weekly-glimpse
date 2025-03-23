import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const auth_user = pgTable('auth_user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const tasks = pgTable('tasks', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => auth_user.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description'),
	dueDate: timestamp('due_date').notNull(),
	completed: text('completed').notNull().default('false'),
	priority: text('priority').default('normal'),
	color: text('color'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const schema = {}; // Stub schema export
