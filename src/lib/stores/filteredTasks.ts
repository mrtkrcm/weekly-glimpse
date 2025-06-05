import { derived } from 'svelte/store';
import type { Task } from '../../types/task';
import { tasks } from './tasks';
import { filters } from './filters';
import { isSameDay } from 'date-fns';

export const filteredTasks = derived([tasks, filters], ([$tasks, $filters]) => {
	if (!$tasks) return [];

	return $tasks.filter((task) => {
		// Filter by search term
		if (
			$filters.searchTerm &&
			!task.title.toLowerCase().includes($filters.searchTerm.toLowerCase())
		) {
			return false;
		}

		// Filter by priority
		if ($filters.priority && task.priority !== $filters.priority) {
			return false;
		}

		// Filter by completion status
		if (!$filters.showCompleted && task.completed) {
			return false;
		}

		// Apply date filter if specified
		if ($filters.date && task.dueDate) {
			if (!isSameDay(new Date(task.dueDate), new Date($filters.date))) {
				return false;
			}
		}

		// Apply status filter if specified
		if ($filters.status && task.status !== $filters.status) {
			return false;
		}

		return true;
	});
});
