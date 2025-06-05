<script lang="ts">
	import { onMount } from 'svelte';
	import { formatDistanceToNow } from 'date-fns';
	import { quintOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';

	type TaskType = {
		id: string | number;
		title: string;
		description?: string;
		dueDate: string;
		completed?: boolean;
		priority?: 'low' | 'medium' | 'high';
		color?: string;
	};

	export let task: TaskType;

	// Define event handler props
	export let onEdit: (task: TaskType) => void;
	export let onDelete: (taskId: string | number) => void;
	export let onToggle: (taskId: string | number, completed: boolean) => void;

	// Format the due date to show relative time
	$: dueInText = formatDistanceToNow(new Date(task.dueDate), {
		addSuffix: true
	});

	// Get priority class for styling
	$: priorityClass =
		task.priority === 'high'
			? 'bg-red-100 text-red-800'
			: task.priority === 'medium'
				? 'bg-amber-100 text-amber-800'
				: 'bg-green-100 text-green-800';

	// Touch handling for swipe gestures
	let startX: number | null = null;
	let currentX: number | null = null;
	let touchOffset = 0;
	let isInDeleteZone = false;
	let showActions = false;
	let taskElement: HTMLElement;

	// Handle touch start
	function handleTouchStart(e: TouchEvent) {
		startX = e.touches[0].clientX;
		currentX = startX;
	}

	// Handle touch move to implement swipe
	function handleTouchMove(e: TouchEvent) {
		if (startX === null) return;

		currentX = e.touches[0].clientX;
		touchOffset = Math.min(0, currentX - startX);

		if (touchOffset < -80) {
			isInDeleteZone = true;
		} else {
			isInDeleteZone = false;
		}

		// Apply transform to the element
		if (taskElement) {
			taskElement.style.transform = `translateX(${touchOffset}px)`;
		}
	}

	// Handle touch end to complete swipe action
	function handleTouchEnd() {
		if (isInDeleteZone) {
			// If in delete zone, commit to show actions
			showActions = true;
			touchOffset = -80;
		} else {
			// Reset position
			touchOffset = 0;
			showActions = false;
		}

		// Animate back to position
		if (taskElement) {
			taskElement.style.transition = 'transform 0.2s ease';
			taskElement.style.transform = `translateX(${touchOffset}px)`;

			// Reset transition after animation completes
			setTimeout(() => {
				if (taskElement) {
					taskElement.style.transition = '';
				}
			}, 200);
		}

		startX = null;
		currentX = null;
	}

	// Close action buttons
	function closeActions() {
		showActions = false;
		touchOffset = 0;

		if (taskElement) {
			taskElement.style.transition = 'transform 0.2s ease';
			taskElement.style.transform = 'translateX(0)';

			setTimeout(() => {
				if (taskElement) {
					taskElement.style.transition = '';
				}
			}, 200);
		}
	}

	// Event handlers
	function handleEdit() {
		closeActions();
		onEdit(task);
	}

	function handleDelete() {
		closeActions();
		onDelete(task.id);
	}

	function handleToggle() {
		onToggle(task.id, !task.completed);
	}

	// Handle click on the task item to prevent propagation to parent
	function handleClick(e: MouseEvent) {
		e.stopPropagation();
	}

	// Keyboard handlers for accessibility
	function handleKeydown(e: KeyboardEvent) {
		// Space or Enter to toggle task completion
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			handleToggle();
		}

		// E key for edit
		if (e.key === 'e' || e.key === 'E') {
			e.preventDefault();
			handleEdit();
		}

		// Escape to close actions
		if (e.key === 'Escape' && showActions) {
			e.preventDefault();
			closeActions();
		}
	}
</script>

<div
	class="task-item group relative border-b border-gray-100 last:border-none transition-all bg-white hover:bg-gray-50"
	class:opacity-75={task.completed}
	bind:this={taskElement}
	on:touchstart={handleTouchStart}
	on:touchmove={handleTouchMove}
	on:touchend={handleTouchEnd}
	on:click={handleClick}
	on:keydown={handleKeydown}
	tabindex="0"
	role="listitem"
	aria-label={`${task.title}, due ${dueInText}, priority ${task.priority || 'normal'}, ${task.completed ? 'completed' : 'not completed'}`}
>
	<div class="flex items-center p-3 sm:p-4">
		<!-- Task completion checkbox -->
		<div class="flex-shrink-0">
			<input
				type="checkbox"
				checked={task.completed}
				on:change={handleToggle}
				class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
				aria-label={`Mark "${task.title}" as ${task.completed ? 'not completed' : 'completed'}`}
			/>
		</div>

		<!-- Task color indicator -->
		{#if task.color}
			<div
				class="flex-shrink-0 ml-3 w-3 h-3 rounded-full"
				style="background-color: {task.color}"
				aria-hidden="true"
			></div>
		{/if}

		<!-- Task content -->
		<div class="ml-3 flex-1 overflow-hidden">
			<div class="flex items-center">
				<h3
					class="text-sm font-medium text-gray-900 truncate transition-all"
					class:line-through={task.completed}
					class:text-gray-500={task.completed}
				>
					{task.title}
				</h3>
			</div>

			{#if task.description}
				<p class="mt-1 text-xs text-gray-500 line-clamp-1" class:line-through={task.completed}>
					{task.description}
				</p>
			{/if}

			<div class="mt-1 flex items-center space-x-2">
				<span class="inline-flex items-center text-xs text-gray-500">
					<svg class="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						></path>
					</svg>
					{dueInText}
				</span>

				{#if task.priority}
					<span
						class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {priorityClass} capitalize"
					>
						{task.priority}
					</span>
				{/if}
			</div>
		</div>

		<!-- Task actions for desktop -->
		<div class="ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
			<button
				type="button"
				class="mr-2 text-gray-400 hover:text-gray-500"
				on:click={handleEdit}
				aria-label="Edit task"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
					></path>
				</svg>
			</button>
			<button
				type="button"
				class="text-gray-400 hover:text-red-500"
				on:click={handleDelete}
				aria-label="Delete task"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					></path>
				</svg>
			</button>
		</div>
	</div>

	<!-- Action buttons for mobile swipe -->
	{#if showActions}
		<div
			class="absolute right-0 top-0 h-full flex items-center"
			transition:slide={{ duration: 200, axis: 'x', easing: quintOut }}
		>
			<button
				type="button"
				class="h-full px-4 bg-blue-500 text-white flex items-center justify-center"
				on:click={handleEdit}
				aria-label="Edit task"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
					></path>
				</svg>
			</button>
			<button
				type="button"
				class="h-full px-4 bg-red-500 text-white flex items-center justify-center"
				on:click={handleDelete}
				aria-label="Delete task"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					></path>
				</svg>
			</button>
		</div>
	{/if}
</div>

<style>
	.task-item {
		touch-action: pan-y;
		user-select: none;
	}
</style>
