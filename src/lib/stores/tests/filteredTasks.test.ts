import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writable } from 'svelte/store';
import { filteredTasks } from '../filteredTasks';
import type { Task } from '../../../types/task';
import { tasks } from '../tasks';
import { filters } from '../filters';

// Mock the tasks and filters stores
vi.mock('$lib/stores/tasks', () => ({
	tasks: writable<Task[]>([])
}));

vi.mock('$lib/stores/filters', () => ({
	filters: writable({
		searchTerm: '',
		priority: null,
		showCompleted: true
	})
}));

describe('filteredTasks', () => {
	const sampleTasks: Task[] = [
		{
			id: '1',
			title: 'Test Task 1',
			description: 'Description 1',
			dueDate: '2025-03-24T10:00:00.000Z',
			priority: 'high',
			completed: false,
			color: '#4F46E5'
		},
		{
			id: '2',
			title: 'Test Task 2',
			description: 'Description 2',
			dueDate: '2025-03-25T14:00:00.000Z',
			priority: 'medium',
			completed: true,
			color: '#4F46E5'
		}
	];

	beforeEach(() => {
		vi.resetModules();
		tasks.set([]);
		filters.set({
			searchTerm: '',
			priority: null,
			showCompleted: true
		});
	});

	it('should return all tasks when no filters are applied', () => {
		tasks.set(sampleTasks);
		filters.set({
			searchTerm: '',
			priority: null,
			showCompleted: true
		});

		let result: Task[] = [];
		filteredTasks.subscribe((value) => {
			result = value;
		});

		expect(result).toEqual(sampleTasks);
	});

	it('should filter tasks by search term', () => {
		tasks.set(sampleTasks);
		filters.set({
			searchTerm: 'Task 1',
			priority: null,
			showCompleted: true
		});

		let result: Task[] = [];
		filteredTasks.subscribe((value) => {
			result = value;
		});

		expect(result).toHaveLength(1);
		expect(result[0].title).toBe('Test Task 1');
	});

	it('should filter tasks by priority', () => {
		tasks.set(sampleTasks);
		filters.set({
			searchTerm: '',
			priority: 'high',
			showCompleted: true
		});

		let result: Task[] = [];
		filteredTasks.subscribe((value) => {
			result = value;
		});

		expect(result).toHaveLength(1);
		expect(result[0].priority).toBe('high');
	});

	it('should filter tasks by completion status', () => {
		tasks.set(sampleTasks);
		filters.set({
			searchTerm: '',
			priority: null,
			showCompleted: false
		});

		let result: Task[] = [];
		filteredTasks.subscribe((value) => {
			result = value;
		});

		expect(result).toHaveLength(1);
		expect(result[0].completed).toBe(false);
	});

	it('should combine multiple filters', () => {
		tasks.set(sampleTasks);
		filters.set({
			searchTerm: 'Task',
			priority: 'high',
			showCompleted: false
		});

		let result: Task[] = [];
		filteredTasks.subscribe((value) => {
			result = value;
		});

		expect(result).toHaveLength(1);
		expect(result[0].title).toBe('Test Task 1');
		expect(result[0].priority).toBe('high');
		expect(result[0].completed).toBe(false);
	});

	it('should return empty array when no tasks match filters', () => {
		tasks.set(sampleTasks);
		filters.set({
			searchTerm: 'nonexistent',
			priority: null,
			showCompleted: true
		});

		let result: Task[] = [];
		filteredTasks.subscribe((value) => {
			result = value;
		});

		expect(result).toHaveLength(0);
	});
});
