<script lang="ts">
	import TaskItem from './TaskItem.svelte';
	import TaskModal from './TaskModal.svelte';
	import CalendarHeader from './CalendarHeader.svelte';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import { onMount } from 'svelte';
	import io, { type Socket } from 'socket.io-client';
	import type { Task } from '../../types/task';

	import { startOfWeek, addWeeks, subWeeks, addDays, format } from 'date-fns';
	import { config } from '$lib/config';

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

	$: days = Array.from({ length: 7 }, (_, i) => addDays(currentDate, i));

	$: tasksByDay = days.map((day) => ({
		date: day,
		tasks: tasks.filter(
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

	async function handleTaskSave(event: CustomEvent<Partial<Task>>): Promise<void> {
		const taskData = event.detail;

		try {
			if (taskData.id) {
				// Update existing task via API
				const response = await fetch('/api/tasks', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(taskData)
				});

				if (!response.ok) {
					throw new Error('Failed to update task');
				}

				const updatedTask = await response.json();
				tasks = tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task));
			} else {
				// Create new task via API
				const response = await fetch('/api/tasks', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						...taskData,
						dueDate: taskData.dueDate
							? new Date(taskData.dueDate).toISOString()
							: new Date().toISOString()
					})
				});

				if (!response.ok) {
					throw new Error('Failed to create task');
				}

				const newTask = await response.json();
				tasks = [...tasks, newTask];
			}

			// Notify other clients via Socket.IO
			socket.emit('task update', { room: 'calendar', tasks });
		} catch (error) {
			console.error('Error saving task:', error);
			alert('Failed to save task. Please try again.');
		}
	}

	async function handleTaskDelete(event: CustomEvent<{ id: number }>): Promise<void> {
		const { id } = event.detail;

		try {
			const response = await fetch('/api/tasks', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});

			if (!response.ok) {
				throw new Error('Failed to delete task');
			}

			tasks = tasks.filter((task) => task.id !== id);
			// Notify other clients
			socket.emit('task update', { room: 'calendar', tasks });
		} catch (error) {
			console.error('Error deleting task:', error);
			alert('Failed to delete task. Please try again.');
		}
	}

	async function handleTaskToggle(
		event: CustomEvent<{ id: number; completed: boolean }>
	): Promise<void> {
		const { id, completed } = event.detail;

		try {
			const response = await fetch('/api/tasks', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, completed })
			});

			if (!response.ok) {
				throw new Error('Failed to update task');
			}

			const updatedTask = await response.json();
			tasks = tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task));
			// Notify other clients
			socket.emit('task update', { room: 'calendar', tasks });
		} catch (error) {
			console.error('Error toggling task:', error);
			alert('Failed to update task status. Please try again.');
		}
	}

	function handleTaskEdit(event: CustomEvent<{ id: number }>): void {
		const { id } = event.detail;
		selectedTask = tasks.find((task) => task.id === id) || {};
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

<div class="p-4 max-w-7xl mx-auto bg-white rounded-lg shadow-sm" role="main">
	<div class="mb-6">
		<CalendarHeader
			{currentDate}
			{view}
			onPreviousWeek={handlePreviousWeek}
			onNextWeek={handleNextWeek}
			onToday={handleToday}
			onToggleView={handleToggleView}
		/>
		<div class="mt-4 flex justify-end">
			<button
				type="button"
				class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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

	<div
		class="grid grid-cols-7 gap-3 border-t border-gray-100 pt-6"
		role="grid"
		aria-label="Weekly calendar"
	>
		{#each tasksByDay as { date, tasks: dayTasks } (format(date, 'yyyy-MM-dd'))}
			<div
				class="min-h-[220px] p-3 bg-gray-50 rounded-lg border border-gray-100 transition-shadow hover:shadow-sm"
				use:dndzone={{ items: dayTasks, flipDurationMs: 300 }}
				on:consider={(e) => handleDrop(e, date)}
				on:finalize={(e) => handleDrop(e, date)}
				role="gridcell"
				aria-label={format(date, 'EEEE, MMMM d')}
			>
				<h3
					class="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-200"
					aria-level="3"
				>
					{format(date, 'EEE, MMM d')}
				</h3>
				<div class="space-y-2" role="list" aria-label={`Tasks for ${format(date, 'EEEE, MMMM d')}`}>
					{#each dayTasks as task (task.id)}
						<div role="listitem">
							<TaskItem
								{task}
								on:edit={handleTaskEdit}
								on:delete={handleTaskDelete}
								on:toggle={handleTaskToggle}
							/>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<TaskModal
	bind:isOpen={isModalOpen}
	task={selectedTask}
	on:save={handleTaskSave}
	on:close={() => (isModalOpen = false)}
/>

<style>
	/* Add any additional styles here */
	:global(body) {
		background-color: #f8fafc;
	}
</style>
