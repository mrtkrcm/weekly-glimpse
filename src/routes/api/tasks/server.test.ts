import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { POST, GET, PUT, DELETE } from './+server';
import { and, eq, gte, lte } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';

describe('Tasks API', () => {
	let mockUser: any;
	let POST_HANDLER: any;
	let GET_HANDLER: any;
	let PUT_HANDLER: any;
	let DELETE_HANDLER: any;

	beforeAll(async () => {
		mockUser = { id: 'user-1', username: 'testuser' };
	});

	// Mock database operations
	beforeEach(() => {
		const stubTask = {
			id: 'task-1',
			title: 'Test Task',
			description: 'Test Description',
			dueDate: new Date().toISOString(),
			completed: false,
			priority: 'medium',
			userId: 'user-1'
		};
		const stubData = [stubTask];
		const stubUpdatedTask = { ...stubTask, title: 'Updated Task' };

		vi.mock('$lib/server/db', () => ({
			db: {
				delete: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([{ id: stubTask.id }])
					})
				}),
				insert: vi.fn().mockReturnValue({
					values: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([stubTask])
					})
				}),
				select: vi.fn().mockReturnValue({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue(stubData)
					})
				}),
				update: vi.fn().mockReturnValue({
					set: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							returning: vi.fn().mockResolvedValue([stubUpdatedTask])
						})
					})
				})
			}
		}));
	});

	vi.mock('$env/dynamic/private', () => ({
		env: {
			DATABASE_URL: 'mocked_database_url'
		}
	}));

	beforeAll(async () => {
		const { POST, GET, PUT, DELETE } = await import('./+server');
		POST_HANDLER = POST;
		GET_HANDLER = GET;
		PUT_HANDLER = PUT;
		DELETE_HANDLER = DELETE;
	});

	afterAll(() => {
		vi.restoreAllMocks();
	});

	it('Create Task (POST)', async () => {
		const taskData = {
			title: 'Test Task',
			description: 'Test Description',
			dueDate: new Date().toISOString(),
			completed: false,
			priority: 'medium'
		};

		const event = {
			request: {
				json: () => Promise.resolve(taskData)
			},
			locals: {
				user: mockUser
			}
		} as any;

		const response = await POST_HANDLER(event);
		const result = await response.json();

		expect(response.status).toBe(200);
		expect(result[0].title).toBe('Test Task');
	});

	it('Read Tasks (GET)', async () => {
		const event = {
			url: new URL('http://localhost?week={"start":"2024-03-23","end":"2024-03-30"}'),
			locals: {
				user: mockUser
			}
		} as any;

		const pageSize = 10; // Configurable page size
const cursor = event.url.searchParams.get('cursor') || null;

const response = await GET_HANDLER({
  ...event,
  url: new URL(`http://localhost?week={"start":"2024-03-23","end":"2024-03-30"}&pageSize=${pageSize}&cursor=${cursor}`)
});
		const result = await response.json();

		expect(response.status).toBe(200);
		expect(result.length).toBeGreaterThan(0);
	});

	it('Update Task (PUT)', async () => {
		const taskData = {
			id: 'task-1',
			title: 'Updated Task',
			priority: 'medium'
		};

		const event = {
			request: {
				json: () => Promise.resolve(taskData)
			},
			locals: {
				user: mockUser
			}
		} as any;

		const response = await PUT_HANDLER(event);
		const result = await response.json();

		expect(response.status).toBe(200);
		expect(result[0].title).toBe('Updated Task');
	});

	it('Delete Task (DELETE)', async () => {
		const taskData = {
			id: 'task-1'
		};

		const event = {
			request: {
				json: () => Promise.resolve(taskData)
			},
			locals: {
				user: mockUser
			}
		} as any;

		const response = await DELETE_HANDLER(event);
		const result = await response.json();

		expect(response.status).toBe(200);
		expect(result[0].id).toBe('task-1');
	});

	it('Read Tasks (GET) with no tasks', async () => {
		const event = {
			url: new URL('http://localhost?week={"start":"2024-03-23","end":"2024-03-30"}'),
			locals: {
				user: mockUser
			}
		} as any;

		// Mock empty response for this test
		vi.mocked(db.select).mockReturnValueOnce({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([])
			})
		} as any);

		const response = await GET_HANDLER(event);
		const result = await response.json();
		expect(response.status).toBe(200);
		expect(result.length).toBe(0);
	});
});
