export interface Task {
	id: number;
	title: string;
	description: string;
	dueDate: string;
	priority: 'low' | 'medium' | 'high';
	completed?: boolean;
	userId?: number;
}
