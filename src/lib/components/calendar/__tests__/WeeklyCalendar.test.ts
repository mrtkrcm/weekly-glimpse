import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import WeeklyCalendar from '../WeeklyCalendar.svelte';
import type { Task } from '../../../../types/task';

// Mock socket.io-client with a function that returns an object
vi.mock('socket.io-client', () => ({
	default: () => ({
		emit: vi.fn(),
		on: vi.fn(),
		disconnect: vi.fn()
	})
}));

// Mock svelte-dnd-action
vi.mock('svelte-dnd-action', () => ({
	dndzone: () => ({
		destroy: vi.fn()
	})
}));

// Mock fetch responses
global.fetch = vi.fn().mockImplementation(() =>
	Promise.resolve({
		ok: true,
		json: () => Promise.resolve({ id: 1, title: 'Test Task' })
	})
);

// Mock config
vi.mock('$lib/server/config', () => ({
	serverConfig: {
		socket: {
			host: 'localhost',
			port: 4000,
			path: '/socket.io/'
		},
		database: {
			name: 'test-db',
			url: 'mongodb://localhost:27017/test-db'
		},
		api: {
			baseUrl: 'http://localhost:4000'
		}
	}
}));

describe('WeeklyCalendar', () => {
	const mockTasks = [
		{
			id: '1',
			title: 'Test Task 1',
			description: 'Test Description 1',
			dueDate: new Date('2025-03-24T10:00:00').toISOString(),
			priority: 'medium',
			completed: false,
			color: '#4F46E5'
		},
		{
			id: '2',
			title: 'Test Task 2',
			description: 'Test Description 2',
			dueDate: new Date('2025-03-25T14:00:00').toISOString(),
			priority: 'high',
			completed: true,
			color: '#4F46E5'
		}
	];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders the calendar grid', () => {
		render(WeeklyCalendar, {
			props: {
				tasks: mockTasks,
				currentDate: new Date('2025-03-24')
			}
		});

		expect(screen.getByRole('grid')).toBeInTheDocument();
	});

	it('displays tasks in the correct day cells', () => {
		render(WeeklyCalendar, {
			props: {
				tasks: mockTasks,
				currentDate: new Date('2025-03-24')
			}
		});

		expect(screen.getByText(/Test Task 1/i)).toBeInTheDocument();
		expect(screen.getByText(/Test Task 2/i)).toBeInTheDocument();
	});

	it('shows task details correctly', () => {
		render(WeeklyCalendar, {
			props: {
				tasks: mockTasks,
				currentDate: new Date('2025-03-24')
			}
		});

		// Check for task descriptions
		expect(screen.getByText('Test Description 1')).toBeInTheDocument();
		expect(screen.getByText('Test Description 2')).toBeInTheDocument();

		// Check for task titles
		expect(screen.getByText(/Test Task 1/i)).toBeInTheDocument();
		expect(screen.getByText(/Test Task 2/i)).toBeInTheDocument();
	});
});
