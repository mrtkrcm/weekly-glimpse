<script lang="ts">
	import { onMount } from 'svelte';
	import { TaskApi } from '$lib/client/api';

	let tasks = [];
	let error = null;
	let loading = true;

	// Get start and end dates for current week
	const today = new Date();
	const startOfWeek = new Date(today);
	startOfWeek.setDate(today.getDate() - today.getDay()); // Start with Sunday

	const endOfWeek = new Date(startOfWeek);
	endOfWeek.setDate(startOfWeek.getDate() + 6); // End with Saturday

	onMount(async () => {
		try {
			// Get tasks for the current week
			tasks = await TaskApi.getWeekTasks(startOfWeek, endOfWeek);
			loading = false;
		} catch (err) {
			error = err.message || 'Failed to load tasks';
			loading = false;
		}
	});
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-4">Weekly Glimpse</h1>

	<div class="mb-6">
		<p class="text-lg">Welcome to Weekly Glimpse, your weekly task planner.</p>
		<p class="mt-2">
			Viewing week: {startOfWeek.toLocaleDateString()} to {endOfWeek.toLocaleDateString()}
		</p>
	</div>

	{#if loading}
		<div class="flex justify-center p-8">
			<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
		</div>
	{:else if error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
			<p><strong>Error:</strong> {error}</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each tasks as task}
				<div
					class="p-4 rounded-lg shadow-md border-l-4"
					style="border-left-color: {task.color || '#3b82f6'};"
				>
					<div class="flex justify-between items-start mb-2">
						<h3 class="text-lg font-semibold {task.completed ? 'line-through text-gray-500' : ''}">
							{task.title}
						</h3>
						<span
							class="px-2 py-1 text-xs rounded-full {task.priority === 'high'
								? 'bg-red-100 text-red-800'
								: task.priority === 'medium'
									? 'bg-yellow-100 text-yellow-800'
									: 'bg-green-100 text-green-800'}"
						>
							{task.priority || 'low'}
						</span>
					</div>

					<p class="text-gray-600 text-sm mb-3">{task.description || 'No description'}</p>

					<div class="flex justify-between items-center">
						<span class="text-xs text-gray-500">
							Due: {new Date(task.dueDate).toLocaleDateString()}
						</span>

						<label class="inline-flex items-center">
							<input
								type="checkbox"
								checked={task.completed}
								disabled
								class="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
							/>
							<span class="ml-2 text-sm text-gray-600">
								{task.completed ? 'Completed' : 'Pending'}
							</span>
						</label>
					</div>
				</div>
			{/each}

			{#if tasks.length === 0}
				<div class="col-span-full text-center py-10 bg-gray-50 rounded-lg">
					<p class="text-gray-500">No tasks for this week. Add some tasks to get started!</p>
				</div>
			{/if}
		</div>
	{/if}

	{#if error}
		<div class="mt-8 p-4 rounded-lg {error.includes('Unauthorized') ? 'bg-blue-50' : 'bg-red-50'}">
			<h2 class="font-bold text-lg mb-2">
				{error.includes('Unauthorized') ? 'Authentication Required' : 'Error Loading Tasks'}
			</h2>
			<p class="text-gray-700">
				{error.includes('Unauthorized') ? 'Please log in to view and manage your tasks.' : error}
			</p>
			<div class="mt-4 flex gap-4">
				{#if error.includes('Unauthorized')}
					<a
						href="/demo/lucia/login"
						class="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
					>
						Log In
					</a>
					<a
						href="/demo/lucia/login?register=true"
						class="inline-block px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors"
					>
						Create Account
					</a>
				{:else}
					<button
						on:click={() => window.location.reload()}
						class="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
					>
						Try Again
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>
