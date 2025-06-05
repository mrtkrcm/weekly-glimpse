import { writable } from 'svelte/store';

export interface FilterState {
	date: string | null;
	status: '' | 'todo' | 'in-progress' | 'done';
	priority: '' | 'low' | 'medium' | 'high';
	searchTerm: string;
}

const defaultFilters: FilterState = {
	date: null,
	status: '',
	priority: '',
	searchTerm: ''
};

export const filters = writable<FilterState>(defaultFilters);
