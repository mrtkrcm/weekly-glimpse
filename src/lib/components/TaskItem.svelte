<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { format } from 'date-fns';
	import type { Task } from '../../types/task';

	const dispatch = createEventDispatcher<{
		edit: { id: number };
		delete: { id: number };
		toggle: { id: number; completed: boolean };
	}>();

	export let task: Task;

	let isMenuOpen = false;

	const priorityColors = {
		low: 'bg-blue-100 text-blue-800',
		medium: 'bg-yellow-100 text-yellow-800',
		high: 'bg-red-100 text-red-800'
	};

	const formatTime = (date: string) => {
		try {
			const parsedDate = new Date(date);
			if (isNaN(parsedDate.getTime())) {
				console.error('Invalid date:', date);
				return 'Invalid time';
			}
			return format(parsedDate, 'h:mm a');
		} catch (error) {
			console.error('Error formatting date:', error);
			return 'Invalid time';
		}
	};

	onMount(() => {
		if (typeof window !== 'undefined') {
			import('hammerjs').then((Hammer) => {
				const taskItem = document.querySelector(`[data-task-id="${task.id}"]`) as HTMLElement;
				if (taskItem) {
					const hammer = new Hammer.default(taskItem);

					hammer.on('swipeleft', () => {
						dispatch('delete', { id: task.id });
					});

					hammer.on('swiperight', () => {
						dispatch('toggle', { id: task.id, completed: !task.completed });
					});
				}
			});
		}
	});
</script>

<div
	class="relative group bg-white border border-gray-100 p-3 rounded-md shadow-sm hover:shadow transition-all duration-200"
	class:bg-gray-50={task.completed}
	data-task-id={task.id}
	role="gridcell"
	tabindex="0"
	style="position: relative; z-index: 1;"
	on:click={() => dispatch('edit', { id: task.id })}
	on:keydown={(e) => {
		if (e.ctrlKey && e.key === 'e') {
			dispatch('edit', { id: task.id });
		} else if (e.ctrlKey && e.key === 'd') {
			dispatch('delete', { id: task.id });
		} else if (e.key === 'Enter') {
			dispatch('edit', { id: task.id });
		}
	}}
>
	<div class="flex items-center gap-2 mb-2">
		<button
			type="button"
			class="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
			class:bg-green-500={task.completed}
			class:border-green-500={task.completed}
			on:click|stopPropagation={() =>
				dispatch('toggle', { id: task.id, completed: !task.completed })}
			on:keydown={(e) => {
				if (e.ctrlKey && e.key === 't') {
					dispatch('toggle', { id: task.id, completed: !task.completed });
				}
			}}
		>
			{#if task.completed}
				<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
			{/if}
		</button>
		<h3 class="text-sm font-medium text-gray-900 flex-grow" class:line-through={task.completed}>
			{task.title}
		</h3>
		{#if task.priority}
			<span
				class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {priorityColors[
					task.priority
				]}"
			>
				{task.priority}
			</span>
		{/if}
	</div>

	{#if task.description}
		<p class="text-sm text-gray-500 mb-2 line-clamp-2">{task.description}</p>
	{/if}

	<div class="flex items-center justify-between text-xs text-gray-500">
		<span>{formatTime(task.dueDate)}</span>
		<div class="relative">
			<button
				type="button"
				class="invisible group-hover:visible p-1 rounded-full hover:bg-gray-100 focus:outline-none"
				on:click|stopPropagation={() => (isMenuOpen = !isMenuOpen)}
				aria-label="Task options"
			>
				<svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
					/>
				</svg>
			</button>

			{#if isMenuOpen}
				<div
					class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
					on:click|stopPropagation={() => {}}
					role="dialog"
					tabindex="0"
					on:keydown={(e) => e.key === 'Escape' && (isMenuOpen = false)}
				>
					<div class="py-1" role="menu">
						<button
							type="button"
							class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
							on:click={() => {
								dispatch('edit', { id: task.id });
								isMenuOpen = false;
							}}
						>
							Edit
						</button>
						<button
							type="button"
							class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
							on:click={() => {
								dispatch('delete', { id: task.id });
								isMenuOpen = false;
							}}
						>
							Delete
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
