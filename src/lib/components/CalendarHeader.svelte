<script lang="ts">
	import { format, addWeeks } from 'date-fns';

	export let currentDate: Date;
	export let view: 'week' | 'month' = 'week';
	export let onPreviousWeek: () => void;
	export let onNextWeek: () => void;
	export let onToday: () => void;
	export let onToggleView: (view: 'week' | 'month') => void;

	const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	function isValidDate(date: any): date is Date {
		return date instanceof Date && !isNaN(date.getTime());
	}

	$: weekRange = {
		start: isValidDate(currentDate) ? format(currentDate, 'MMM d') : 'Invalid date',
		end: isValidDate(currentDate) ? format(addWeeks(currentDate, 1), 'MMM d, yyyy') : 'Invalid date'
	};

	$: if (!isValidDate(currentDate)) {
		console.error('CalendarHeader: Invalid date provided', currentDate);
	}
</script>

<div class="bg-white rounded-t-lg" role="navigation" aria-label="Calendar navigation">
	<div class="px-2">
		<div class="flex h-16 justify-between items-center">
			<!-- Navigation Controls -->
			<div class="flex items-center space-x-2">
				<button
					type="button"
					class="inline-flex items-center px-3 py-2 border border-gray-200 text-sm font-medium rounded-md text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
					on:click={onPreviousWeek}
					aria-label="Previous week"
				>
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path
							fill-rule="evenodd"
							d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>

				<button
					type="button"
					class="inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-md text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
					on:click={onToday}
					aria-label="Go to today"
				>
					Today
				</button>

				<button
					type="button"
					class="inline-flex items-center px-3 py-2 border border-gray-200 text-sm font-medium rounded-md text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
					on:click={onNextWeek}
					aria-label="Next week"
				>
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path
							fill-rule="evenodd"
							d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>

			<!-- Current Week Display -->
			<h2 class="text-lg font-semibold text-gray-800" role="status" aria-live="polite">
				{weekRange.start} - {weekRange.end}
			</h2>

			<!-- View Toggle -->
			<div class="flex items-center">
				<button
					type="button"
					class="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
					class:bg-blue-50={view === 'week'}
					class:text-blue-700={view === 'week'}
					class:border-blue-300={view === 'week'}
					class:bg-white={view !== 'week'}
					class:text-gray-600={view !== 'week'}
					class:border-gray-200={view !== 'week'}
					class:hover:bg-gray-50={view !== 'week'}
					on:click={() => onToggleView(view === 'week' ? 'month' : 'week')}
					aria-pressed={view === 'week'}
					aria-label="Toggle calendar view"
				>
					{view === 'week' ? 'Week View' : 'Month View'}
				</button>
			</div>
		</div>

		<!-- Day Headers -->
		<div class="grid grid-cols-7 gap-3 py-3 text-sm font-medium text-gray-500" role="row">
			{#each days as day}
				<div class="text-center py-2 rounded bg-gray-50" role="columnheader" aria-label={day}>
					{day}
				</div>
			{/each}
		</div>
	</div>
</div>
