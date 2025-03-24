import { pgTable, text, uuid, timestamp, index } from 'drizzle-orm/pg-core';

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: timestamp('due_date'),
  priority: text('priority').notNull(),
  status: text('status').notNull(),
  userId: uuid('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    userIdIdx: index('user_id_idx').on(table.userId),
    statusIdx: index('status_idx').on(table.status),
    dueDateIdx: index('due_date_idx').on(table.dueDate),
    priorityIdx: index('priority_idx').on(table.priority),
    userStatusDueDateIdx: index('user_status_due_date_idx').on(table.userId, table.status, table.dueDate),
    userPriorityDueDateIdx: index('user_priority_due_date_idx').on(table.userId, table.priority, table.dueDate)
  };
});

// User schema for authentication
export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  hashedPassword: text('hashed_password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => {
  return {
    usernameIdx: index('username_idx').on(table.username)
  };
});

// Session schema for Lucia authentication
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  attributes: text('attributes').notNull().default('{}')
}, (table) => {
  return {
    userIdIdx: index('session_user_id_idx').on(table.userId)
  };
});

// Google account integration schema
export const googleAccounts = pgTable('google_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  googleId: text('google_id').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    userIdIdx: index('google_accounts_user_id_idx').on(table.userId),
    googleIdIdx: index('google_id_idx').on(table.googleId)
  };
});

// Google calendars schema
export const googleCalendars = pgTable('google_calendars', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull(),
  calendarId: text('calendar_id').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    accountIdIdx: index('google_calendars_account_id_idx').on(table.accountId),
    calendarIdIdx: index('calendar_id_idx').on(table.calendarId)
  };
});

// Shared calendars schema
export const sharedCalendars = pgTable('shared_calendars', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ownerId: uuid('owner_id').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    ownerIdIdx: index('shared_calendars_owner_id_idx').on(table.ownerId),
    nameIdx: index('shared_calendars_name_idx').on(table.name)
  };
});

// Calendar members schema for managing shared calendars
export const calendarMembers = pgTable('calendar_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  calendarId: uuid('calendar_id').notNull(),
  userId: uuid('user_id').notNull(),
  role: text('role').notNull().default('viewer'), // viewer, editor, owner
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    calendarUserIdx: index('calendar_user_idx').on(table.calendarId, table.userId),
    userIdIdx: index('calendar_members_user_id_idx').on(table.userId)
  };
});
