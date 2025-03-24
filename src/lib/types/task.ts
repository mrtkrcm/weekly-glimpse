export interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  userId: string;
  // Add other task properties
}

export interface TaskResponse {
  task: Task;
  success: boolean;
  error?: string;
}