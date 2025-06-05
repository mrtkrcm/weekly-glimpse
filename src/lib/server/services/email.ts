import { serverConfig } from '../config';
import type { Task } from '$lib/types/task';
import { trackPerformance } from '../monitoring';

interface EmailTemplate {
	subject: string;
	text: string;
	html: string;
}

export class EmailService {
	private client: any;

	constructor() {
		if (serverConfig.email.service === 'sendgrid') {
			// Dynamically import @sendgrid/mail to avoid bundling issues
			import('@sendgrid/mail').then((sgMail) => {
				this.client = sgMail.default;
				this.client.setApiKey(serverConfig.email.apiKey);
			});
		}
	}

	private async sendEmail(to: string, template: EmailTemplate): Promise<void> {
		if (!this.client) {
			console.error('Email client not initialized');
			return;
		}

		try {
			await this.client.send({
				to,
				from: serverConfig.email.from,
				replyTo: serverConfig.email.replyTo,
				subject: template.subject,
				text: template.text,
				html: template.html
			});
		} catch (error) {
			console.error('Failed to send email:', error);
			throw new Error('Failed to send email');
		}
	}

	@trackPerformance('sendTaskReminder')
	async sendTaskReminder(to: string, task: Task): Promise<void> {
		const template = this.getTaskReminderTemplate(task);
		await this.sendEmail(to, template);
	}

	private getTaskReminderTemplate(task: Task): EmailTemplate {
		const dueDate = new Date(task.dueDate).toLocaleString();

		const text = `
      Task Reminder: ${task.title}

      Due: ${dueDate}
      Priority: ${task.priority}

      ${task.description || 'No description provided'}

      View your task: ${serverConfig.env.isProduction ? 'https://weeklyglimpse.com' : 'http://localhost:5173'}
    `.trim();

		const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Task Reminder: ${task.title}</h2>

        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Due:</strong> ${dueDate}</p>
          <p><strong>Priority:</strong> <span style="color: ${
						task.priority === 'high'
							? '#dc2626'
							: task.priority === 'medium'
								? '#d97706'
								: '#059669'
					};">${task.priority}</span></p>

          ${
						task.description
							? `
            <div style="margin-top: 16px;">
              <strong>Description:</strong>
              <p style="margin-top: 8px;">${task.description}</p>
            </div>
          `
							: ''
					}
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${serverConfig.env.isProduction ? 'https://weeklyglimpse.com' : 'http://localhost:5173'}"
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Task
          </a>
        </div>
      </div>
    `.trim();

		return {
			subject: `Task Reminder: ${task.title}`,
			text,
			html
		};
	}
}

// Export singleton instance
export const emailService = new EmailService();
