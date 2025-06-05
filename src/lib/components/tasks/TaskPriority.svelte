<!-- src/lib/components/task/TaskPriority.svelte -->
<script lang="ts">
	export let priority: 'low' | 'medium' | 'high';
	export let onChange: (newPriority: 'low' | 'medium' | 'high') => void;

	const priorityColors = {
		low: 'bg-blue-100 text-blue-800',
		medium: 'bg-yellow-100 text-yellow-800',
		high: 'bg-red-100 text-red-800'
	};
</script>

<div class="task-priority">
	<select
		class={priorityColors[priority]}
		value={priority}
		on:change={(e) => onChange((e.target as HTMLSelectElement).value as 'low' | 'medium' | 'high')}
	>
		<option value="low">Low</option>
		<option value="medium">Medium</option>
		<option value="high">High</option>
	</select>
</div>
