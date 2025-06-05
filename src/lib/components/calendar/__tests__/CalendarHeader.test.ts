/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import CalendarHeader from '../CalendarHeader.svelte';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

describe('CalendarHeader', () => {
	const mockProps = {
		currentDate: new Date('2024-03-24'),
		view: 'week',
		onNavigate: vi.fn(),
		onViewChange: vi.fn()
	};

	it('renders correctly', () => {
		render(CalendarHeader, { props: mockProps });

		expect(screen.getByText('Mar 24 - Mar 30, 2024')).toBeInTheDocument();
		expect(screen.getByLabelText('Previous week')).toBeInTheDocument();
		expect(screen.getByLabelText('Next week')).toBeInTheDocument();
		expect(screen.getByText('Today')).toBeInTheDocument();
	});

	it('handles navigation events correctly', async () => {
		render(CalendarHeader, { props: mockProps });

		const prevButton = screen.getByLabelText('Previous week');
		const nextButton = screen.getByLabelText('Next week');
		const todayButton = screen.getByText('Today');

		await fireEvent.click(prevButton);
		expect(mockProps.onNavigate).toHaveBeenCalledWith('PREV');

		await fireEvent.click(nextButton);
		expect(mockProps.onNavigate).toHaveBeenCalledWith('NEXT');

		await fireEvent.click(todayButton);
		expect(mockProps.onNavigate).toHaveBeenCalledWith('TODAY');
	});

	it('handles view toggle correctly', async () => {
		render(CalendarHeader, { props: mockProps });

		const weekButton = screen.getByLabelText('Week view');
		const monthButton = screen.getByLabelText('Month view');

		await fireEvent.click(monthButton);
		expect(mockProps.onViewChange).toHaveBeenCalledWith('month');

		await fireEvent.click(weekButton);
		expect(mockProps.onViewChange).toHaveBeenCalledWith('week');
	});
});
