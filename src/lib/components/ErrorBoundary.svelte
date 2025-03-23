<!-- Error boundary component for graceful error handling -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { dev } from '$app/environment';
	import type { ComponentType } from 'svelte';

	let error: Error | null = null;
	let errorInfo: { componentStack?: string } = {};

	// Props
	export let fallback: ComponentType | undefined = undefined;
	export let onError: ((error: Error, errorInfo: { componentStack?: string }) => void) | undefined =
		undefined;

	function handleError(event: ErrorEvent): void {
		if (!(event.error instanceof Error)) {
			return;
		}

		error = event.error;
		errorInfo = event.error.stack ? { componentStack: event.error.stack } : {};

		if (onError) {
			onError(event.error, errorInfo);
		}

		// Prevent the error from propagating
		event.preventDefault();
	}

	onMount((): void => {
		window.addEventListener('error', handleError);
	});

	onDestroy((): void => {
		window.removeEventListener('error', handleError);
	});
</script>

{#if error}
	{#if fallback}
		<svelte:component this={fallback} {error} {errorInfo} />
	{:else}
		<div class="error-boundary" role="alert">
			<h2>Something went wrong</h2>
			{#if dev}
				<details>
					<summary>Error details</summary>
					<pre>{error.message}</pre>
					{#if errorInfo.componentStack}
						<pre>{errorInfo.componentStack}</pre>
					{/if}
				</details>
			{/if}
		</div>
	{/if}
{:else}
	<slot />
{/if}

<style>
	.error-boundary {
		padding: 1rem;
		margin: 1rem 0;
		border: 1px solid #ff5555;
		border-radius: 0.25rem;
		background-color: #fff5f5;
		color: #c53030;
	}

	.error-boundary h2 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
	}

	.error-boundary details {
		margin-top: 1rem;
	}

	.error-boundary pre {
		padding: 0.5rem;
		background-color: #fff;
		border-radius: 0.25rem;
		overflow-x: auto;
		font-size: 0.875rem;
	}
</style>
