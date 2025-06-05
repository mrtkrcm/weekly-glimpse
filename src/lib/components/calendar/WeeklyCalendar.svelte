<script lang="ts">
	import TaskItem from '../tasks/TaskItem.svelte';
	import TaskModal from '../tasks/TaskModal.svelte';
	import CalendarHeader from './CalendarHeader.svelte';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import { onMount, createEventDispatcher } from 'svelte';
	import io, { type Socket } from 'socket.io-client';
	import type { Task } from '../../../types/task';

	import { startOfWeek, addWeeks, subWeeks, addDays, format } from 'date-fns';
	import { config } from '$lib/config';
	import { derived, writable, type Writable } from 'svelte/store';

	const dispatch = createEventDispatcher();

	interface TaskUpdateEvent {
		room: string;
		tasks: Task[];
	}

	export let tasks: Task[] = [];
	let socket: Socket;
	let isModalOpen = false;
	let selectedTask: Partial<Task> = {};
	let currentDate = startOfWeek(new Date(), { weekStartsOn: 1 });
	let view: 'week' | 'month' = 'week';

	// Task filtering
	let filterOpen = false;
	const filters: Writable<{
		priority: ('low' | 'medium' | 'high' | null)[];
		completed: boolean | null;
	}> = writable({
		priority: ['low', 'medium', 'high'],
		completed: null
	});

	// Filter tasks based on selected filters
	$: filteredTasks = tasks.filter((task) => {
		const f = $filters;

		// Filter by priority
		if (f.priority.length > 0 && !f.priority.includes(task.priority as any)) {
			return false;
		}

		// Filter by completion status
		if (f.completed !== null && task.completed !== f.completed) {
			return false;
		}

		return true;
	});

	$: days = Array.from({ length: 7 }, (_, i) => addDays(currentDate, i));

	// Update the tasksByDay to use filteredTasks instead of tasks
	$: tasksByDay = days.map((day) => ({
		date: day,
		tasks: filteredTasks.filter(
			(task) => format(new Date(task.dueDate), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
		)
	}));

	function handleDrop(event: CustomEvent<DndEvent<Task>>, targetDate: Date): void {
		const { items } = event.detail;
		const updatedTasks = tasks.map((task) => {
			const droppedTask = items.find((item: Task) => item.id === task.id);
			if (droppedTask) {
				return {
					...task,
					dueDate: format(targetDate, "yyyy-MM-dd'T'HH:mm:ssXXX")
				};
			}
			return task;
		});

		tasks = updatedTasks;
		// Send the entire tasks array to ensure consistency
		socket.emit('task update', { room: 'calendar', tasks: updatedTasks });
	}

	async function handleTaskSave(taskData: Partial<Task>): Promise<void> {
		try {
			// Dispatch to parent component
			dispatch('taskUpdate', { task: taskData });

			// Close modal
			isModalOpen = false;
		} catch (error) {
			console.error('Error saving task:', error);
		}
	}

	function handleTaskDelete(taskId: string | number): void {
		try {
			// Dispatch to parent component
			dispatch('taskDelete', { taskId });
		} catch (error) {
			console.error('Error deleting task:', error);
		}
	}

	function handleTaskToggle(taskId: string | number, completed: boolean): void {
		try {
			// Dispatch to parent component
			dispatch('taskToggle', { taskId, completed });
		} catch (error) {
			console.error('Error toggling task:', error);
		}
	}

	function handleTaskEdit(task: Task): void {
		selectedTask = { ...task };
		isModalOpen = true;
	}

	function handlePreviousWeek(): void {
		currentDate = subWeeks(currentDate, 1);
	}

	function handleNextWeek(): void {
		currentDate = addWeeks(currentDate, 1);
	}

	function handleToday(): void {
		currentDate = startOfWeek(new Date(), { weekStartsOn: 1 });
	}

	function handleToggleView(newView: 'week' | 'month'): void {
		view = newView;
		// TODO: Implement month view
	}

	// Toggle filter selection
	function togglePriorityFilter(priority: 'low' | 'medium' | 'high') {
		filters.update((f) => {
			const currentPriorities = [...f.priority];
			const index = currentPriorities.indexOf(priority);

			if (index > -1) {
				currentPriorities.splice(index, 1);
			} else {
				currentPriorities.push(priority);
			}

			return {
				...f,
				priority: currentPriorities
			};
		});
	}

	// Toggle completion filter
	function toggleCompletionFilter(status: boolean | null) {
		filters.update((f) => ({
			...f,
			completed: f.completed === status ? null : status
		}));
	}

	// Task creation when clicking on empty day cells
	async function handleDayClick(day: Date): Promise<void> {
		selectedTask = {
			title: '',
			description: '',
			dueDate: new Date(day).toISOString(),
			priority: 'medium'
		};
		isModalOpen = true;
	}

	onMount((): (() => void) => {
		socket = io(`http://${config.socket.host}:${config.socket.port}`, {
			path: config.socket.path,
			transports: ['websocket', 'polling']
		});
		socket.emit('join', 'calendar');

		// Listen for task updates from the server
		socket.on('task updated', (data: TaskUpdateEvent) => {
			if (data.tasks && Array.isArray(data.tasks)) {
				console.log('Received updated tasks from server:', data.tasks.length);
				tasks = data.tasks;
			}
		});

		return () => {
			socket.emit('leave', 'calendar');
			socket.disconnect();
		};
	});
</script>

<div class="max-w-full mx-auto bg-white shadow-md overflow-hidden" role="main">
	<div class="p-6 border-b border-gray-100">
		<CalendarHeader
			{currentDate}
			{view}
			onNavigate={(action) => {
				if (action === 'PREV') handlePreviousWeek();
				else if (action === 'NEXT') handleNextWeek();
				else if (action === 'TODAY') handleToday();
			}}
			onViewChange={handleToggleView}
		/>
		<div class="mt-5 flex justify-between items-center">
			<!-- Filter button and dropdown -->
			<div class="relative">
				<button
					type="button"
					class="inline-flex items-center px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
					on:click={() => (filterOpen = !filterOpen)}
					aria-expanded={filterOpen}
					aria-haspopup="true"
				>
					<svg
						class="w-4 h-4 mr-2 text-gray-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
						/>
					</svg>
					Filter
					<span
						class="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-indigo-600 bg-indigo-100 rounded-full"
					>
						{$filters.priority.length !== 3 || $filters.completed !== null ? 'Active' : ''}
					</span>
				</button>

				{#if filterOpen}
					<div
						class="origin-top-left absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 p-2"
						on:click|stopPropagation={() => {}}
						on:keydown={(e) => e.key === 'Escape' && (filterOpen = false)}
					>
						<div class="p-2">
							<h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
								Priority
							</h4>
							<div class="space-y-1">
								{#each ['low', 'medium', 'high'] as priority}
									<div class="flex items-center">
										<input
											type="checkbox"
											id={`filter-${priority}`}
											checked={$filters.priority.includes(priority as any)}
											on:change={() => togglePriorityFilter(priority as any)}
											class="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
										/>
										<label for={`filter-${priority}`} class="ml-2 text-xs text-gray-700 capitalize">
											{priority}
										</label>
									</div>
								{/each}
							</div>

							<h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">
								Status
							</h4>
							<div class="space-y-1">
								<div class="flex items-center">
									<input
										type="radio"
										id="filter-all"
										name="completion"
										checked={$filters.completed === null}
										on:change={() => toggleCompletionFilter(null)}
										class="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300"
									/>
									<label for="filter-all" class="ml-2 text-xs text-gray-700"> All </label>
								</div>
								<div class="flex items-center">
									<input
										type="radio"
										id="filter-pending"
										name="completion"
										checked={$filters.completed === false}
										on:change={() => toggleCompletionFilter(false)}
										class="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300"
									/>
									<label for="filter-pending" class="ml-2 text-xs text-gray-700"> Pending </label>
								</div>
								<div class="flex items-center">
									<input
										type="radio"
										id="filter-completed"
										name="completion"
										checked={$filters.completed === true}
										on:change={() => toggleCompletionFilter(true)}
										class="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300"
									/>
									<label for="filter-completed" class="ml-2 text-xs text-gray-700">
										Completed
									</label>
								</div>
							</div>

							<div class="mt-4 pt-2 border-t border-gray-100">
								<button
									type="button"
									class="text-xs text-indigo-600 hover:text-indigo-800"
									on:click={() => {
										filters.set({
											priority: ['low', 'medium', 'high'],
											completed: null
										});
									}}
								>
									Reset filters
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Add Task button -->
			<button
				type="button"
				class="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
				on:click={() => {
					selectedTask = {};
					isModalOpen = true;
				}}
				aria-label="Add new task"
				on:keydown={(e) => {
					if (e.ctrlKey && e.key === 'n') {
						selectedTask = {};
						isModalOpen = true;
					}
				}}
			>
				<svg
					class="w-5 h-5 mr-2"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Add Task
			</button>
		</div>
	</div>

	<div class="grid grid-cols-7 gap-4 p-6" role="grid" aria-label="Weekly calendar">
		{#each tasksByDay as { date, tasks: dayTasks } (format(date, 'yyyy-MM-dd'))}
			<div
				class="min-h-[240px] p-4 bg-white rounded-lg border border-gray-100 transition-all hover:shadow-md cursor-pointer"
				use:dndzone={{ items: dayTasks, flipDurationMs: 300 }}
				on:consider={(e) => handleDrop(e, date)}
				on:finalize={(e) => handleDrop(e, date)}
				on:click={() => {
					selectedTask = { dueDate: format(date, "yyyy-MM-dd'T'HH:mm:ssXXX") };
					isModalOpen = true;
				}}
				on:keydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						selectedTask = { dueDate: format(date, "yyyy-MM-dd'T'HH:mm:ssXXX") };
						isModalOpen = true;
					}
				}}
				role="button"
				aria-label={`Add task on ${format(date, 'EEEE, MMMM d')}`}
				tabindex="0"
			>
				<div
					class="font-medium text-sm mb-3 pb-2 border-b border-gray-100 flex items-center justify-between"
					class:text-indigo-600={format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
				>
					<span>{format(date, 'EEE')}</span>
					<span class="text-gray-800 font-semibold">{format(date, 'd')}</span>
				</div>

				<div class="space-y-2 overflow-y-auto max-h-[200px]" on:click|stopPropagation={() => {}}>
					{#each dayTasks as task (task.id)}
						<TaskItem
							{task}
							onEdit={(taskData) => handleTaskEdit(taskData)}
							onDelete={(taskId) => handleTaskDelete(taskId)}
							onToggle={(taskId, completed) => handleTaskToggle(taskId, completed)}
						/>
					{:else}
						<div class="flex items-center justify-center h-24 text-gray-400 text-sm italic">
							No tasks
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

{#if isModalOpen}
	<TaskModal
		task={selectedTask}
		isOpen={isModalOpen}
		onSave={(taskData) => {
			handleTaskSave(taskData);
		}}
		onClose={() => {
			isModalOpen = false;
		}}
	/>
{/if}

<style>
	/* Add any additional styles here */
</style>
