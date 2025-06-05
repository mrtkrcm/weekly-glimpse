import { describe, it, expect, vi } from 'vitest';
import { getTasks } from './taskRepository';
import { db } from '../db';
import { tasks } from '../schema';
import { eq, and, gte, lte } from 'drizzle-orm';

describe('Task Repository', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should get tasks with default pagination', async () => {
		const mockTasks = [
			{
				id: '1',
				title: 'Task 1',
				userId: 'user-1',
				status: 'open',
				priority: 'high',
				dueDate: new Date()
			}
		];
		const mockCountResult = [{ count: 1 }];

		vi.spyOn(db, 'select').mockImplementation(() => ({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue(mockTasks)
			}) as any
		}));

		vi.spyOn(db, 'select').mockImplementationOnce(() => ({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue(mockCountResult)
			}) as any
		}));

		const result = await getTasks('user-1');

		expect(db.select).toHaveBeenCalledTimes(2);
		expect(result.data).toEqual(mockTasks);
		expect(result.pagination).toEqual({
			page: 1,
			limit: 20,
			totalItems: 1,
			totalPages: 1
		});
	});

	it('should get tasks with custom pagination and filters', async () => {
		const mockTasks = [
			{
				id: '1',
				title: 'Task 1',
				userId: 'user-1',
				status: 'completed',
				priority: 'high',
				dueDate: new Date('2024-01-02')
			}
		];
		const mockCountResult = [{ count: 1 }];

		vi.spyOn(db, 'select').mockImplementation(() => ({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue(mockTasks)
			}) as any
		}));

		vi.spyOn(db, 'select').mockImplementationOnce(() => ({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue(mockCountResult)
			}) as any
		}));

		const result = await getTasks('user-1', {
			page: 2,
			limit: 10,
			status: 'completed',
			startDate: new Date('2024-01-01'),
			endDate: new Date('2024-01-03')
		});

		expect(db.select).toHaveBeenCalledTimes(2);
		expect(result.data).toEqual(mockTasks);
		expect(result.pagination).toEqual({
			page: 2,
			limit: 10,
			totalItems: 1,
			totalPages: 1
		});
	});

	it('should handle no tasks found', async () => {
		vi.spyOn(db, 'select').mockImplementation(() => ({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([])
			}) as any
		}));

		vi.spyOn(db, 'select').mockImplementationOnce(() => ({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([{ count: 0 }])
			}) as any
		}));

		const result = await getTasks('user-1');

		expect(db.select).toHaveBeenCalledTimes(2);
		expect(result.data).toEqual([]);
		expect(result.pagination).toEqual({
			page: 1,
			limit: 20,
			totalItems: 0,
			totalPages: 0
		});
	});
});
