import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { filterStore, filters, type FilterState } from '../filterStore';

describe('filterStore', () => {
	beforeEach(() => {
		// Reset filters to default values before each test
		filters.set({
			date: null,
			status: '',
			priority: '',
			searchTerm: ''
		});
	});

	it('should initialize with default values', () => {
		const filterState = get(filters);
		expect(filterState).toEqual({
			date: null,
			status: '',
			priority: '',
			searchTerm: ''
		});
	});

	it('should update date filter', () => {
		const newDate = '2023-01-01';
		filters.update((state) => ({ ...state, date: newDate }));

		const updatedFilters = get(filters);
		expect(updatedFilters.date).toBe(newDate);
		expect(updatedFilters.status).toBe('');
		expect(updatedFilters.priority).toBe('');
		expect(updatedFilters.searchTerm).toBe('');
	});

	it('should update status filter', () => {
		const newStatus: FilterState['status'] = 'todo';
		filters.update((state) => ({ ...state, status: newStatus }));

		const updatedFilters = get(filters);
		expect(updatedFilters.date).toBe(null);
		expect(updatedFilters.status).toBe('todo');
		expect(updatedFilters.priority).toBe('');
		expect(updatedFilters.searchTerm).toBe('');
	});

	it('should update priority filter', () => {
		const newPriority: FilterState['priority'] = 'high';
		filters.update((state) => ({ ...state, priority: newPriority }));

		const updatedFilters = get(filters);
		expect(updatedFilters.date).toBe(null);
		expect(updatedFilters.status).toBe('');
		expect(updatedFilters.priority).toBe('high');
		expect(updatedFilters.searchTerm).toBe('');
	});

	it('should update search term filter', () => {
		const newSearchTerm = 'test search';
		filters.update((state) => ({ ...state, searchTerm: newSearchTerm }));

		const updatedFilters = get(filters);
		expect(updatedFilters.date).toBe(null);
		expect(updatedFilters.status).toBe('');
		expect(updatedFilters.priority).toBe('');
		expect(updatedFilters.searchTerm).toBe('test search');
	});

	it('should update multiple filters at once', () => {
		const updates: Partial<FilterState> = {
			status: 'in-progress',
			priority: 'medium',
			searchTerm: 'important'
		};

		filters.update((state) => ({ ...state, ...updates }));

		const updatedFilters = get(filters);
		expect(updatedFilters.date).toBe(null);
		expect(updatedFilters.status).toBe('in-progress');
		expect(updatedFilters.priority).toBe('medium');
		expect(updatedFilters.searchTerm).toBe('important');
	});

	it('should reset all filters', () => {
		// First set some non-default values
		filters.update(() => ({
			date: '2023-01-01',
			status: 'done',
			priority: 'low',
			searchTerm: 'completed'
		}));

		// Then reset to defaults
		filters.set({
			date: null,
			status: '',
			priority: '',
			searchTerm: ''
		});

		const resetFilters = get(filters);
		expect(resetFilters).toEqual({
			date: null,
			status: '',
			priority: '',
			searchTerm: ''
		});
	});
});
