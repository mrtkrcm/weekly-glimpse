<script lang="ts">
	import { format, startOfWeek, endOfWeek } from 'date-fns';

	export let currentDate: Date;
	export let view: 'week' | 'month';
	export let onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
	export let onViewChange: (view: 'week' | 'month') => void;

	$: formattedDate = format(currentDate, 'MMMM yyyy');
	$: weekRange =
		view === 'week'
			? `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`
			: formattedDate;
</script>

<div class="flex justify-between items-center">
	<h2 class="text-lg font-semibold text-gray-900">
		{weekRange}
	</h2>

	<div class="flex space-x-2">
		<div class="flex border border-gray-200 rounded-lg overflow-hidden">
			<button
				type="button"
				class="flex items-center justify-center px-3 py-1.5 text-gray-700 hover:bg-gray-100 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
				on:click={() => onNavigate('PREV')}
				aria-label="Previous {view}"
			>
				<svg
					class="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"
					></path>
				</svg>
			</button>
			<button
				type="button"
				class="px-3 py-1.5 text-gray-700 hover:bg-gray-100 text-sm transition-colors border-l border-r border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
				on:click={() => onNavigate('TODAY')}
			>
				Today
			</button>
			<button
				type="button"
				class="flex items-center justify-center px-3 py-1.5 text-gray-700 hover:bg-gray-100 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
				on:click={() => onNavigate('NEXT')}
				aria-label="Next {view}"
			>
				<svg
					class="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"
					></path>
				</svg>
			</button>
		</div>

		<div class="flex border border-gray-200 rounded-lg overflow-hidden">
			<button
				type="button"
				class="px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				class:bg-indigo-600={view === 'week'}
				class:text-white={view === 'week'}
				class:hover:bg-indigo-700={view === 'week'}
				class:text-gray-700={view !== 'week'}
				class:hover:bg-gray-100={view !== 'week'}
				on:click={() => onViewChange('week')}
				aria-label="Week view"
				aria-pressed={view === 'week'}
			>
				Week
			</button>
			<button
				type="button"
				class="px-3 py-1.5 text-sm border-l border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				class:bg-indigo-600={view === 'month'}
				class:text-white={view === 'month'}
				class:hover:bg-indigo-700={view === 'month'}
				class:text-gray-700={view !== 'month'}
				class:hover:bg-gray-100={view !== 'month'}
				on:click={() => onViewChange('month')}
				aria-label="Month view"
				aria-pressed={view === 'month'}
			>
				Month
			</button>
		</div>
	</div>
</div>
