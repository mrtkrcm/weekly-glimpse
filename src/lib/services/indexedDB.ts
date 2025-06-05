import Dexie from 'dexie';
import type { Task } from '../../types/task';

export class TaskDatabase extends Dexie {
	tasks: Dexie.Table<Task, string | number>;

	constructor() {
		super('WeeklyGlimpseDB');
		this.version(1).stores({
			tasks: 'id, title, dueDate, priority, completed'
		});
		this.tasks = this.table('tasks');
	}

	async getTasks(): Promise<Task[]> {
		return this.tasks.toArray();
	}

	async addTask(task: Task): Promise<string | number> {
		return this.tasks.add(task);
	}

	async updateTask(task: Task): Promise<number> {
		return this.tasks.update(task.id, task);
	}

	async deleteTask(id: string | number): Promise<void> {
		return this.tasks.delete(id);
	}
}

export const db = new TaskDatabase();
