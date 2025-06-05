export interface Task {
	id: string | number;
	title: string;
	description?: string;
	dueDate: string;
	priority?: 'low' | 'medium' | 'high';
	userId?: string | number;
	status?: string;
	completed?: boolean;
	color?: string;
}
