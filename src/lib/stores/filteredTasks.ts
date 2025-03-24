import { derived } from 'svelte/store';
import { tasks } from './taskStore';
import { filters } from './filterStore';
import { isSameDay } from 'date-fns';

export const filteredTasks = derived(
  [tasks, filters],
  ([$tasks, $filters]) => {
    return $tasks.filter(task => {
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
      // Apply priority filter if specified
      if ($filters.priority && task.priority !== $filters.priority) {
        return false;
      }
      // Apply search term filter if specified
      if ($filters.searchTerm && !task.title.toLowerCase().includes($filters.searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
  }
);