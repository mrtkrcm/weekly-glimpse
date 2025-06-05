import { emailService } from './email';
import type { Task } from '$lib/types/task';
import { db } from '../db';
import { tasks, user } from '../db/schema';
import { and, eq, gt } from 'drizzle-orm';
import { trackPerformance } from '../monitoring';

interface NotificationJob {
	taskId: string;
	userId: string;
	scheduledFor: Date;
}

class NotificationService {
	private notificationQueue: NotificationJob[] = [];
	private isProcessing: boolean = false;
	private checkInterval: number = 60000; // Check every minute
	private intervalId: NodeJS.Timeout | null = null;

	constructor() {
		this.startProcessing();
	}

	@trackPerformance('scheduleTaskReminder')
	async scheduleTaskReminder(taskId: string, userId: string, dueDate: Date): Promise<void> {
		// Schedule reminder 30 minutes before due date
		const reminderTime = new Date(dueDate.getTime() - 30 * 60000);

		// Don't schedule if the reminder time has already passed
		if (reminderTime <= new Date()) {
			return;
		}

		this.notificationQueue.push({
			taskId,
			userId,
			scheduledFor: reminderTime
		});

		// Sort queue by scheduled time
		this.notificationQueue.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
	}

	private startProcessing(): void {
		if (this.intervalId) {
			return;
		}

		this.intervalId = setInterval(async () => {
			if (this.isProcessing || this.notificationQueue.length === 0) {
				return;
			}

			this.isProcessing = true;
			await this.processQueue();
			this.isProcessing = false;
		}, this.checkInterval);
	}

	private async processQueue(): Promise<void> {
		const now = new Date();
		const dueNotifications = this.notificationQueue.filter((job) => job.scheduledFor <= now);

		if (dueNotifications.length === 0) {
			return;
		}

		// Remove due notifications from queue
		this.notificationQueue = this.notificationQueue.filter((job) => job.scheduledFor > now);

		// Process each due notification
		for (const job of dueNotifications) {
			try {
				await this.sendTaskReminder(job.taskId, job.userId);
			} catch (error) {
				console.error('Failed to process notification:', error);
			}
		}
	}

	@trackPerformance('sendTaskReminder')
	private async sendTaskReminder(taskId: string, userId: string): Promise<void> {
		try {
			// Get task and user details
			const [taskData] = await db
				.select()
				.from(tasks)
				.where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
				.limit(1);

			if (!taskData) {
				console.error('Task not found:', taskId);
				return;
			}

			const [userData] = await db.select().from(user).where(eq(user.id, userId)).limit(1);

			if (!userData) {
				console.error('User not found:', userId);
				return;
			}

			// Send email notification
			await emailService.sendTaskReminder(userData.username, taskData);
		} catch (error) {
			console.error('Failed to send task reminder:', error);
			throw error;
		}
	}

	@trackPerformance('scheduleUpcomingReminders')
	async scheduleUpcomingReminders(): Promise<void> {
		try {
			// Get all upcoming tasks (due in the next 24 hours)
			const upcomingTasks = await db
				.select()
				.from(tasks)
				.where(
					and(
						gt(tasks.dueDate, new Date()),
						gt(tasks.dueDate, new Date(Date.now() + 24 * 60 * 60 * 1000))
					)
				);

			// Schedule reminders for each task
			for (const task of upcomingTasks) {
				await this.scheduleTaskReminder(task.id, task.userId, new Date(task.dueDate));
			}
		} catch (error) {
			console.error('Failed to schedule upcoming reminders:', error);
			throw error;
		}
	}

	// Cleanup on service shutdown
	destroy(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}
}

// Export singleton instance
export const notificationService = new NotificationService();
