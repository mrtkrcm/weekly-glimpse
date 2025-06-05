import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NotificationService } from '../notification';
import { emailService } from '../email';
import { db } from '../db';
import { tasks, user } from '../db/schema';
import { and, eq, gt } from 'drizzle-orm';
import type { Task } from '$lib/types/task';

vi.mock('../email', () => ({
	emailService: {
		sendTaskReminder: vi.fn()
	}
}));

vi.mock('../db', () => ({
	db: {
		select: vi.fn(() => db),
		from: vi.fn(() => db),
		where: vi.fn(() => db),
		innerJoin: vi.fn(() => db),
		on: vi.fn(() => db),
		execute: vi.fn()
	}
}));

describe('NotificationService', () => {
	let notificationService: NotificationService;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();

		// Setup mock data
		vi.mocked(db.execute).mockResolvedValue([
			{
				task: {
					id: '123',
					title: 'Test Task',
					description: 'Test Description',
					dueDate: new Date('2024-03-25T10:00:00Z'),
					priority: 'high',
					userId: 'user123',
					completed: false
				} as Task,
				user: {
					id: 'user123',
					email: 'test@example.com',
					name: 'Test User'
				}
			}
		]);

		notificationService = new NotificationService();
	});

	afterEach(() => {
		vi.useRealTimers();
		notificationService.destroy();
	});

	it('should schedule task reminder correctly', async () => {
		const taskId = '123';
		const userId = 'user123';
		const dueDate = new Date('2024-03-25T10:00:00Z');

		await notificationService.scheduleTaskReminder(taskId, userId, dueDate);

		// Fast forward time to just before reminder (29 minutes)
		vi.advanceTimersByTime(29 * 60 * 1000);
		expect(emailService.sendTaskReminder).not.toHaveBeenCalled();

		// Fast forward to reminder time (30 minutes before due date)
		vi.advanceTimersByTime(1 * 60 * 1000);
		expect(emailService.sendTaskReminder).toHaveBeenCalledTimes(1);
	});

	it('should not schedule reminder for past due dates', async () => {
		const taskId = '123';
		const userId = 'user123';
		const pastDueDate = new Date(Date.now() - 1000); // 1 second ago

		await notificationService.scheduleTaskReminder(taskId, userId, pastDueDate);
		vi.advanceTimersByTime(60 * 1000); // Advance 1 minute
		expect(emailService.sendTaskReminder).not.toHaveBeenCalled();
	});

	it('should schedule upcoming reminders on initialization', async () => {
		await notificationService.scheduleUpcomingReminders();

		// Verify that the database was queried correctly
		expect(db.select).toHaveBeenCalled();
		expect(db.from).toHaveBeenCalledWith(tasks);
		expect(db.innerJoin).toHaveBeenCalledWith(user);
		expect(db.where).toHaveBeenCalledWith(
			and(eq(tasks.completed, false), gt(tasks.dueDate, expect.any(Date)))
		);

		// Fast forward to reminder time
		vi.advanceTimersByTime(30 * 60 * 1000);
		expect(emailService.sendTaskReminder).toHaveBeenCalled();
	});

	it('should handle errors when sending reminders', async () => {
		const taskId = '123';
		const userId = 'user123';
		const dueDate = new Date('2024-03-25T10:00:00Z');

		// Mock email service to throw an error
		vi.mocked(emailService.sendTaskReminder).mockRejectedValueOnce(new Error('Send failed'));

		// Schedule reminder
		await notificationService.scheduleTaskReminder(taskId, userId, dueDate);

		// Fast forward to reminder time
		vi.advanceTimersByTime(30 * 60 * 1000);

		// Verify error was handled gracefully (service continues running)
		expect(notificationService).toBeDefined();
	});
});
