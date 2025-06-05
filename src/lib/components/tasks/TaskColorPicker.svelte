<script lang="ts">
	// Define available colors
	const colors = [
		{ value: '#4F46E5', label: 'Indigo' },
		{ value: '#06B6D4', label: 'Cyan' },
		{ value: '#10B981', label: 'Emerald' },
		{ value: '#F59E0B', label: 'Amber' },
		{ value: '#EF4444', label: 'Red' },
		{ value: '#8B5CF6', label: 'Violet' },
		{ value: '#EC4899', label: 'Pink' },
		{ value: '#6B7280', label: 'Gray' }
	];

	export let selectedColor: string = colors[0].value;
	export let onChange: (color: string) => void;

	// Update color and call change handler
	function selectColor(color: string) {
		selectedColor = color;
		onChange(color);
	}
</script>

<div class="color-picker">
	<div class="flex flex-wrap gap-2">
		{#each colors as color}
			<button
				type="button"
				class="color-option relative h-8 w-8 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				style="background-color: {color.value}; border-color: {selectedColor === color.value
					? 'white'
					: 'transparent'}; box-shadow: {selectedColor === color.value
					? '0 0 0 2px rgb(79, 70, 229)'
					: 'none'}"
				on:click={() => selectColor(color.value)}
				aria-label="Select {color.label} color"
				aria-pressed={selectedColor === color.value}
			>
				{#if selectedColor === color.value}
					<svg
						class="absolute inset-0 h-full w-full text-white"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
					>
						<path d="M5 13l4 4L19 7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
						></path>
					</svg>
				{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.color-option {
		cursor: pointer;
	}

	/* Increase contrast for white checkmark on light colors */
	.color-option[style*='background-color: #10B981'] svg,
	.color-option[style*='background-color: #F59E0B'] svg,
	.color-option[style*='background-color: #06B6D4'] svg {
		filter: drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.5));
	}
</style>
