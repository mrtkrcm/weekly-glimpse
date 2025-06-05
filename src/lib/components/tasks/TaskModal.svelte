<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import { format } from 'date-fns';
	import type { Task } from '../../../types/task';
	import { DEFAULT_PRIORITIES } from '$lib/constants';
	import { fade } from 'svelte/transition';
	import TaskColorPicker from './TaskColorPicker.svelte';

	// Custom events
	export let onSave: (taskData: Partial<Task>) => void;
	export let onClose: () => void;

	export let task: Partial<Task> = {};
	export let isOpen = false;

	let formData = {
		title: '',
		description: '',
		dueDate: '',
		priority: 'medium' as 'low' | 'medium' | 'high',
		color: '#4F46E5' // Default indigo color
	};

	let titleInput: HTMLInputElement;

	// Initialize form data when the component mounts
	onMount(() => {
		if (isOpen) {
			resetFormData();
		}
		if (titleInput) {
			titleInput.focus();
		}

		// Add global keyboard event listener
		const handleKeydown = (e: KeyboardEvent) => {
			// Close modal with Escape
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}

			// Submit form with Ctrl+Enter or Command+Enter
			if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isOpen) {
				if (formData.title.trim()) {
					handleSubmit();
				}
			}
		};

		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	afterUpdate(() => {
		if (isOpen && titleInput) {
			titleInput.focus();
		}
	});

	// Reset form data whenever task or isOpen changes
	$: if (isOpen) {
		resetFormData();
	}

	function resetFormData() {
		if (!task) {
			task = {};
		}
		formData = {
			title: task.title || '',
			description: task.description || '',
			dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : '',
			priority: (task.priority || 'medium') as 'low' | 'medium' | 'high',
			color: task.color || '#4F46E5' // Default indigo color
		};
	}

	function handleSubmit() {
		// Prevent submission if required fields are empty
		if (!formData.title.trim() || !formData.dueDate) {
			return;
		}

		const payload: Partial<Task> = {
			...formData,
			dueDate: formData.dueDate
				? new Date(formData.dueDate).toISOString()
				: new Date().toISOString()
		};

		if (task.id) {
			payload.id = task.id;
		}

		onSave(payload);
	}

	// Helper for accessibility
	function getFormattedDate(dateString: string): string {
		try {
			return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
		} catch (e) {
			return '';
		}
	}
</script>

{#if isOpen}
	<div
		transition:fade={{ duration: 150 }}
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		aria-modal="true"
		role="dialog"
		aria-labelledby="modal-title"
		on:click|self={onClose}
		on:keydown={(e) => e.key === 'Escape' && onClose()}
	>
		<div
			class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 my-8 overflow-hidden"
			on:click|stopPropagation={() => {}}
		>
			<div class="px-6 pt-6 pb-2">
				<div class="flex justify-between items-center mb-4">
					<h2 id="modal-title" class="text-lg font-semibold text-gray-900">
						{task.id ? 'Edit Task' : 'Add New Task'}
					</h2>
					<button
						type="button"
						class="text-gray-400 hover:text-gray-500 transition-colors"
						on:click={onClose}
						aria-label="Close modal"
					>
						<svg
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<form on:submit|preventDefault={handleSubmit} role="form">
					<div class="space-y-4">
						<div>
							<label for="title" class="block text-sm font-medium text-gray-700 mb-1"
								>Title <span class="text-red-500">*</span></label
							>
							<input
								type="text"
								id="title"
								bind:value={formData.title}
								bind:this={titleInput}
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
								placeholder="Task title"
								aria-required="true"
							/>
						</div>

						<div>
							<label for="description" class="block text-sm font-medium text-gray-700 mb-1"
								>Description</label
							>
							<textarea
								id="description"
								bind:value={formData.description}
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
								rows="3"
								placeholder="Task description (optional)"
							></textarea>
						</div>

						<div>
							<label for="dueDate" class="block text-sm font-medium text-gray-700 mb-1"
								>Due Date <span class="text-red-500">*</span></label
							>
							<input
								type="datetime-local"
								id="dueDate"
								bind:value={formData.dueDate}
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
								aria-required="true"
								aria-describedby="dueDate-description"
							/>
							{#if formData.dueDate}
								<p id="dueDate-description" class="mt-1 text-xs text-gray-500">
									{getFormattedDate(formData.dueDate)}
								</p>
							{/if}
						</div>

						<div>
							<label for="priority" class="block text-sm font-medium text-gray-700 mb-1"
								>Priority</label
							>
							<div class="flex space-x-4">
								{#each DEFAULT_PRIORITIES as p}
									<label class="inline-flex items-center">
										<input
											type="radio"
											name="priority"
											value={p}
											checked={formData.priority === p}
											on:change={() => (formData.priority = p)}
											class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
										/>
										<span class="ml-2 text-sm text-gray-700 capitalize">{p}</span>
									</label>
								{/each}
							</div>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
							<TaskColorPicker
								selectedColor={formData.color}
								onChange={(color) => (formData.color = color)}
							/>
						</div>
					</div>

					<div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
						<button
							type="button"
							class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
							on:click={onClose}
						>
							Cancel <span class="text-xs ml-1 text-gray-500">(Esc)</span>
						</button>
						<button
							type="submit"
							class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={!formData.title.trim() || !formData.dueDate}
						>
							{task.id ? 'Update' : 'Create'}
							<span class="text-xs ml-1 text-indigo-200">(Ctrl+Enter)</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
