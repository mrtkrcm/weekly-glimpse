/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import * as svelte from 'svelte';
import TaskItem from '../TaskItem.svelte';
import '@testing-library/jest-dom';
import type { Task } from '../../types/task';

describe('TaskItem', () => {
	const mockTask = {
		id: '1',
		title: 'Test Task',
		description: 'Test Description',
		dueDate: new Date('2024-03-24T00:00:00Z').toISOString(),
		priority: 'medium',
		completed: false,
		color: '#4F46E5'
	};

	it('renders task details correctly', () => {
		render(TaskItem, {
			props: {
				task: mockTask,
				onToggle: vi.fn(),
				onEdit: vi.fn(),
				onDelete: vi.fn()
			}
		});

		expect(screen.getByText('Test Task')).toBeInTheDocument();
		expect(screen.getByText('Test Description')).toBeInTheDocument();
		expect(screen.getByText('medium')).toBeInTheDocument();
		expect(screen.getByText(/about \d+ (days?|months?|years?) ago/i)).toBeInTheDocument();
	});

	it('emits toggle event on checkbox click', async () => {
		const handleToggle = vi.fn();
		render(TaskItem, {
			props: {
				task: mockTask,
				onToggle: handleToggle,
				onEdit: vi.fn(),
				onDelete: vi.fn()
			}
		});

		const checkbox = screen.getByRole('checkbox');
		await userEvent.click(checkbox);

		expect(handleToggle).toHaveBeenCalledWith(mockTask.id, true);
	});

	it('emits edit event on task item click', async () => {
		const handleEdit = vi.fn();
		render(TaskItem, {
			props: {
				task: mockTask,
				onToggle: vi.fn(),
				onEdit: handleEdit,
				onDelete: vi.fn()
			}
		});

		const editButton = screen.getByRole('button', { name: /edit task/i });
		await userEvent.click(editButton);

		expect(handleEdit).toHaveBeenCalledWith(mockTask);
	});

	it('emits delete event when clicking delete in menu', async () => {
		const handleDelete = vi.fn();
		render(TaskItem, {
			props: {
				task: mockTask,
				onToggle: vi.fn(),
				onEdit: vi.fn(),
				onDelete: handleDelete
			}
		});

		const deleteButton = screen.getByRole('button', { name: /delete task/i });
		await userEvent.click(deleteButton);

		expect(handleDelete).toHaveBeenCalledWith(mockTask.id);
	});
});
