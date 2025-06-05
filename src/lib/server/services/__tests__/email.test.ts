import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EmailService } from '../email';

const mockSendGrid = {
	setApiKey: vi.fn(),
	send: vi.fn()
};

vi.mock('@sendgrid/mail', () => ({
	__esModule: true,
	default: mockSendGrid
}));

let emailService: EmailService;

describe('EmailService', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		const { EmailService } = await import('../email');
		emailService = new EmailService();
		// Wait for dynamic import to complete
		await new Promise((resolve) => setTimeout(resolve, 0));
	});

	it('should initialize SendGrid client with API key', async () => {
		const { serverConfig } = await import('../../config');
		expect(mockSendGrid.setApiKey).toHaveBeenCalledWith(serverConfig.email.apiKey);
	});

	it('should send task reminder email', async () => {
		const { serverConfig } = await import('../../config');
		const task = {
			id: '123',
			title: 'Test Task',
			description: 'Test Description',
			dueDate: new Date('2024-03-25T10:00:00Z'),
			priority: 'high',
			completed: false
		};
		const userEmail = 'test@example.com';

		await emailService.sendTaskReminder(userEmail, task);

		expect(mockSendGrid.send).toHaveBeenCalledTimes(1);
		const [emailData] = mockSendGrid.send.mock.calls[0];
		expect(emailData).toMatchObject({
			to: userEmail,
			from: serverConfig.email.from,
			replyTo: serverConfig.email.replyTo,
			subject: expect.any(String),
			text: expect.any(String),
			html: expect.any(String)
		});
	});

	it('should handle errors when sending email fails', async () => {
		mockSendGrid.send.mockRejectedValueOnce(new Error('Send failed'));

		const task = {
			id: '123',
			title: 'Test Task',
			description: 'Test Description',
			dueDate: new Date('2024-03-25T10:00:00Z'),
			priority: 'high',
			completed: false
		};
		const userEmail = 'test@example.com';

		await expect(emailService.sendTaskReminder(userEmail, task)).rejects.toThrow(
			'Failed to send email'
		);
	});
});
