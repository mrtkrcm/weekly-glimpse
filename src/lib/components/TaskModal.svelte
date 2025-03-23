<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { format } from 'date-fns';
	import type { Task } from '../../types/task';

	const dispatch = createEventDispatcher<{
		save: Partial<Task>;
		close: void;
	}>();

	export let task: Partial<Task> = {};

	export let isOpen = false;

	let formData = {
		title: task.title || '',
		description: task.description || '',
		dueDate: task.dueDate
			? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm")
			: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
		priority: task.priority || 'medium'
	};

	$: if (isOpen && task.id) {
		formData = {
			title: task.title || '',
			description: task.description || '',
			dueDate: task.dueDate
				? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm")
				: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
			priority: task.priority || 'medium'
		};
	}

	function handleSubmit() {
		const payload: Partial<Task> = {
			...formData,
			dueDate: new Date(formData.dueDate).toISOString()
		};

		if (task.id) {
			payload.id = task.id;
		}

		dispatch('save', payload);
		isOpen = false;
	}

	function handleClose() {
		dispatch('close');
		isOpen = false;
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm transition-opacity"
		on:click={handleClose}
		on:keydown={(e) => e.key === 'Escape' && handleClose()}
		role="presentation"
	></div>

	<div class="fixed inset-0 z-10 overflow-y-auto">
		<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
			<div
				class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 border border-gray-100"
				on:click|stopPropagation={() => {}}
				on:keydown={(e) => e.key === 'Escape' && handleClose()}
				role="dialog"
				tabindex="0"
				aria-modal="true"
				aria-labelledby="modal-title"
			>
				<div class="absolute right-0 top-0 pr-4 pt-4">
					<button
						type="button"
						class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						on:click={handleClose}
					>
						<span class="sr-only">Close</span>
						<svg
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<div>
						<label for="title" class="block text-sm font-medium text-gray-700">Title</label>
						<input
							type="text"
							id="title"
							bind:value={formData.title}
							required
							class="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
						/>
					</div>

					<div>
						<label for="description" class="block text-sm font-medium text-gray-700"
							>Description</label
						>
						<textarea
							id="description"
							bind:value={formData.description}
							rows="3"
							class="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
						></textarea>
					</div>

					<div>
						<label for="dueDate" class="block text-sm font-medium text-gray-700">Due Date</label>
						<input
							type="datetime-local"
							id="dueDate"
							bind:value={formData.dueDate}
							required
							class="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
						/>
					</div>

					<div>
						<label for="priority" class="block text-sm font-medium text-gray-700">Priority</label>
						<select
							id="priority"
							bind:value={formData.priority}
							class="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
						>
							<option value="low">Low</option>
							<option value="medium">Medium</option>
							<option value="high">High</option>
						</select>
					</div>

					<div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
						<button
							type="submit"
							class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2 transition-colors"
						>
							{task.id ? 'Save Changes' : 'Create Task'}
						</button>
						<button
							type="button"
							class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 sm:col-start-1 sm:mt-0 transition-colors"
							on:click={handleClose}
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
