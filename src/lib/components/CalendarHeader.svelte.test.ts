/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import CalendarHeader from './CalendarHeader.svelte';
import '@testing-library/jest-dom';

describe('CalendarHeader', () => {
	it('renders correctly', () => {
		const props = {
			currentDate: new Date(),
			view: 'week',
			onPreviousWeek: vi.fn(),
			onNextWeek: vi.fn(),
			onToday: vi.fn(),
			onToggleView: vi.fn()
		};

		render(CalendarHeader, { props });

		// Expect navigation buttons
		expect(screen.getByLabelText('Previous week')).toBeInTheDocument();
		expect(screen.getByLabelText('Next week')).toBeInTheDocument();
		expect(screen.getByText('Today')).toBeInTheDocument();

		// Expect day headers
		['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((day) => {
			expect(screen.getByText(day)).toBeInTheDocument();
		});
	});
});
