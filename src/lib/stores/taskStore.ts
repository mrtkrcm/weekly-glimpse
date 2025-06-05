import { writable } from 'svelte/store';
import type { Task } from '$lib/types/task';
import * as taskService from '$lib/services/taskService';

function createTaskStore() {
	const { subscribe, update, set } = writable<Task[]>([]);

	return {
		subscribe,
		add: (task: Task) => update((tasks) => [...tasks, task]),
		remove: (id: string) => update((tasks) => tasks.filter((t) => t.id !== id)),
		update: (updatedTask: Task) =>
			update((tasks) => tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))),
		load: async () => {
			// Assuming taskService.fetchTasks is implemented; if not, defaults to an empty array.
			try {
				const tasksFromApi = await (taskService.fetchTasks
					? taskService.fetchTasks()
					: Promise.resolve([]));
				set(tasksFromApi);
			} catch (error) {
				set([]);
			}
		}
	};
}

export const tasks = createTaskStore();
