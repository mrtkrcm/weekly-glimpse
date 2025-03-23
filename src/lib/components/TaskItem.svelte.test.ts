/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import * as svelte from 'svelte';
import TaskItem from './TaskItem.svelte';
import '@testing-library/jest-dom';
import type { Task } from '../../types/task';

describe('TaskItem', () => {
	const mockTask: Task = {
		id: 1,
		title: 'Test Task',
		description: 'Test Description',
		dueDate: new Date().toISOString(),
		completed: false,
		priority: 'medium',
		userId: 1
	};

	it('renders task details correctly', async () => {
		render(TaskItem, { props: { task: mockTask } });

		expect(screen.getByText('Test Task')).toBeInTheDocument();
		expect(screen.getByText('Test Description')).toBeInTheDocument();
		expect(screen.getByText('medium')).toBeInTheDocument();
	});

	it('emits toggle event on checkbox click', async () => {
		const dispatch = vi.fn();
		vi.spyOn(svelte, 'createEventDispatcher').mockImplementation(() => dispatch);

		const user = userEvent.setup();
		render(TaskItem, { props: { task: mockTask } });

		// Find and click the toggle button using userEvent
		const toggleButton = screen.getAllByRole('button')[0];
		await user.click(toggleButton);

		// Wait for Svelte to update
		await tick();

		expect(dispatch).toHaveBeenCalledWith('toggle', {
			id: 1,
			completed: true
		});
	});
});
