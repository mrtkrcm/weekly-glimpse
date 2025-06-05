<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';

	export let localTaskCount: number = 0;
	export let dismissed: boolean = false;

	const dispatch = createEventDispatcher<{
		login: void;
		dismiss: void;
	}>();

	// Display fully on first visit, minimized on subsequent visits
	$: isMinimized = dismissed;
	let showTips = false;

	// Tips for guest users
	const tips = [
		'Tasks are saved only on this device while in guest mode',
		'Create an account to access your tasks from any device',
		'Swipe left on tasks to reveal actions',
		'Click on empty day cells to quickly add tasks',
		'Use Ctrl+Enter to quickly save when creating tasks'
	];

	// Random tip selection
	let currentTipIndex = Math.floor(Math.random() * tips.length);
	let tipInterval: ReturnType<typeof setInterval>;

	onMount(() => {
		// Rotate tips every 8 seconds
		tipInterval = setInterval(() => {
			currentTipIndex = (currentTipIndex + 1) % tips.length;
		}, 8000);

		return () => {
			clearInterval(tipInterval);
		};
	});

	// Handle login button click
	function handleLogin() {
		dispatch('login');
	}

	// Handle dismiss button click
	function handleDismiss() {
		dispatch('dismiss');
	}

	// Toggle minimized state
	function toggleMinimized() {
		isMinimized = !isMinimized;
	}

	// Toggle tips visibility
	function toggleTips() {
		showTips = !showTips;
	}
</script>

<div
	class="guest-indicator bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-lg shadow-md overflow-hidden {isMinimized
		? 'minimized'
		: ''} mb-4"
>
	{#if isMinimized}
		<!-- Minimized view -->
		<div
			class="px-3 py-2 flex items-center justify-between cursor-pointer"
			on:click={toggleMinimized}
			on:keydown={(e) => e.key === 'Enter' && toggleMinimized()}
			tabindex="0"
			role="button"
			aria-expanded="false"
			aria-label="Expand guest mode information"
			in:slide={{ duration: 200 }}
		>
			<div class="flex items-center">
				<svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span class="font-medium text-sm">Guest Mode ({localTaskCount} tasks)</span>
			</div>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</div>
	{:else}
		<!-- Expanded view -->
		<div in:slide={{ duration: 300 }}>
			<div class="px-4 py-4">
				<div class="flex justify-between items-start">
					<div class="flex items-center">
						<svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<h3 class="text-lg font-semibold">You're using Guest Mode</h3>
					</div>
					<button
						type="button"
						class="rounded-full p-1 text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
						on:click={toggleMinimized}
						aria-label="Minimize guest mode banner"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 15l7-7 7 7"
							/>
						</svg>
					</button>
				</div>

				<div class="mt-2">
					<p class="text-indigo-100">
						You currently have <span class="font-semibold"
							>{localTaskCount} task{localTaskCount !== 1 ? 's' : ''}</span
						> saved locally on this device.
					</p>

					{#if showTips}
						<div
							class="mt-3 bg-indigo-700 bg-opacity-50 rounded p-3"
							transition:fade={{ duration: 200 }}
						>
							<div class="flex items-center text-indigo-100 text-sm">
								<svg
									class="w-4 h-4 mr-2 flex-shrink-0"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
									/>
								</svg>
								<span class="tip-text">{tips[currentTipIndex]}</span>
							</div>
						</div>
					{/if}
				</div>

				<div class="mt-4 flex flex-wrap gap-2">
					<button
						type="button"
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						on:click={handleLogin}
					>
						<svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
							/>
						</svg>
						Log In to Save Tasks
					</button>
					<button
						type="button"
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-100 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
						on:click={toggleTips}
					>
						<svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						{showTips ? 'Hide Tips' : 'Show Tips'}
					</button>
					<button
						type="button"
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-100 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
						on:click={handleDismiss}
					>
						Don't Show Again
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.guest-indicator {
		transition: all 0.3s ease;
	}

	.guest-indicator.minimized {
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
	}

	.tip-text {
		animation: fadeInOut 8s infinite;
	}

	@keyframes fadeInOut {
		0%,
		100% {
			opacity: 0.7;
		}
		20%,
		80% {
			opacity: 1;
		}
	}
</style>
