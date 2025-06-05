import { writable } from 'svelte/store';
import type { Priority } from '../../types/task';

interface Filters {
	searchTerm: string;
	priority: Priority | null;
	showCompleted: boolean;
}

export const filters = writable<Filters>({
	searchTerm: '',
	priority: null,
	showCompleted: true
});

export function resetFilters() {
	filters.set({
		searchTerm: '',
		priority: null,
		showCompleted: true
	});
}

export function updateSearchTerm(term: string) {
	filters.update((f) => ({ ...f, searchTerm: term }));
}

export function updatePriorityFilter(priority: Priority | null) {
	filters.update((f) => ({ ...f, priority }));
}

export function updateCompletedFilter(showCompleted: boolean) {
	filters.update((f) => ({ ...f, showCompleted }));
}
