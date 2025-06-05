import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaskModal from '../TaskModal.svelte';
import { createEventDispatcher, tick } from 'svelte';
import { format } from 'date-fns';

vi.mock('svelte', async () => {
	const actual = await vi.importActual('svelte');
	return {
		...actual,
		createEventDispatcher: vi.fn(() => vi.fn())
	};
});

describe('TaskModal', () => {
	const mockTask = {
		id: '1',
		title: 'Test Task',
		description: 'Test Description',
		dueDate: '2025-03-26T10:00:00.000Z',
		priority: 'high',
		completed: false,
		color: '#4F46E5'
	};

	const mockOnSave = vi.fn();
	const mockOnClose = vi.fn();

	// Mock the new Date() to return a fixed date for consistent testing
	const fixedDate = new Date('2025-03-26T12:00:00.000Z');
	const originalDate = global.Date;

	beforeEach(() => {
		vi.clearAllMocks();
		global.Date = class extends Date {
			constructor(date) {
				if (date) {
					return new originalDate(date);
				}
				return fixedDate;
			}
		} as any;
	});

	afterEach(() => {
		global.Date = originalDate;
	});

	it('renders a modal with an empty form for new task', () => {
		const { getByLabelText, getByText } = render(TaskModal, {
			props: {
				isOpen: true,
				onSave: mockOnSave,
				onClose: mockOnClose
			}
		});

		// Check that form fields are empty
		expect(getByLabelText('Title *')).toHaveValue('');
		expect(getByLabelText('Description')).toHaveValue('');

		// Verify the submit button text and state
		const submitButton = getByText('Create', { exact: false }).closest('button');
		expect(submitButton).toBeInTheDocument();
		expect(submitButton).toHaveAttribute('disabled');
	});

	it('populates the form with task data when editing', async () => {
		const mockTask = {
			id: '123',
			title: 'Test Task',
			description: 'Test Description',
			dueDate: '2025-03-26T14:30:00.000Z',
			priority: 'high',
			color: '#FF0000'
		};

		const { getByLabelText, getByText } = render(TaskModal, {
			props: {
				isOpen: true,
				task: mockTask,
				onSave: mockOnSave,
				onClose: mockOnClose
			}
		});

		// Check that form fields are populated
		expect(getByLabelText('Title *')).toHaveValue('Test Task');
		expect(getByLabelText('Description')).toHaveValue('Test Description');

		// Check the date value - use the actual format from the component
		const dueDateInput = getByLabelText('Due Date *');
		expect(dueDateInput).toHaveValue('2025-03-26T21:30');

		// Check that high priority radio is selected
		const highRadioInputs = document.querySelectorAll('input[type="radio"]');
		const highRadio = Array.from(highRadioInputs).find((el) =>
			el.closest('label')?.textContent?.includes('high')
		) as HTMLInputElement;
		expect(highRadio.checked).toBe(true);

		// Verify the submit button text and state
		const submitButton = getByText('Update', { exact: false }).closest('button');
		expect(submitButton).toBeInTheDocument();
		expect(submitButton).not.toHaveAttribute('disabled');
	});

	it('dispatches save event with form data when submitted', async () => {
		const { getByLabelText, getByText } = render(TaskModal, {
			props: {
				isOpen: true,
				onSave: mockOnSave,
				onClose: mockOnClose
			}
		});

		// Fill out the form
		await fireEvent.input(getByLabelText('Title *'), { target: { value: 'New Task' } });
		await fireEvent.input(getByLabelText('Due Date *'), { target: { value: '2025-03-26T21:30' } });
		await tick();

		// Submit the form using the button
		const submitButton = getByText('Create', { exact: false }).closest('button');
		expect(submitButton).not.toHaveAttribute('disabled');
		await fireEvent.click(submitButton);

		// Check that onSave was called with the correct data
		expect(mockOnSave).toHaveBeenCalled();
		expect(mockOnSave.mock.calls[0][0]).toMatchObject({
			title: 'New Task',
			priority: 'medium',
			color: expect.any(String)
		});

		// Verify dueDate is an ISO string that includes the date we set
		const dueDate = mockOnSave.mock.calls[0][0].dueDate;
		expect(dueDate).toContain('2025-03-26');
	});

	it('validates required fields before submission', async () => {
		const onSave = vi.fn();
		const { getByText, getByLabelText } = render(TaskModal, {
			props: {
				isOpen: true,
				onSave,
				onClose: () => {}
			}
		});

		await tick();
		const getSubmitButton = () => getByText(/create/i).closest('button');
		expect(getSubmitButton()).toBeDisabled();

		// Fill in title only
		await fireEvent.input(getByLabelText('Title *'), { target: { value: 'New Task' } });
		await tick();
		expect(getSubmitButton()).toBeDisabled();

		// Fill in both required fields
		const dueDate = format(new Date(), "yyyy-MM-dd'T'HH:mm");
		await fireEvent.input(getByLabelText('Due Date *'), { target: { value: dueDate } });
		await tick();
		expect(getSubmitButton()).not.toBeDisabled();

		// Submit the form
		await fireEvent.click(getSubmitButton());
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				title: 'New Task',
				dueDate: expect.any(String)
			})
		);
	});
});
