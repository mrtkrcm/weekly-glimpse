<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/authStore';
	import { syncService } from '$lib/services/syncService';
	import { browser } from '$app/environment';

	// export let data;
	export let form;

	let username = '';
	let password = '';
	let isRegistering = false;
	let syncInProgress = false;
	let syncCount = 0;

	onMount(() => {
		// Check if we should show the registration form based on URL params
		isRegistering = new URLSearchParams(window.location.search).has('register');
	});

	// Function to handle successful login
	async function handleSuccessfulAuth(userData) {
		if (browser) {
			// Update auth store
			authStore.login({
				id: userData.id,
				username: userData.username
			});

			// Trigger synchronization of local tasks with server
			syncInProgress = true;
			try {
				syncCount = await syncService.syncTasksOnLogin();
				console.log(`Synchronized ${syncCount} tasks`);
			} catch (error) {
				console.error('Sync error:', error);
			} finally {
				syncInProgress = false;

				// Redirect to the main page after a short delay
				// This gives the user time to see the sync notification
				setTimeout(
					() => {
						goto('/');
					},
					syncCount > 0 ? 1500 : 0
				);
			}
		}
	}

	// Handle server-side authentication completion
	$: if (form?.success) {
		handleSuccessfulAuth(form.user);
	}
</script>

<div class="auth-container">
	<div class="auth-box">
		<h2>{isRegistering ? 'Create Account' : 'Log In'}</h2>

		<form method="POST" action="?/{isRegistering ? 'register' : 'login'}">
			<div class="form-group">
				<label for="username">Username</label>
				<input id="username" name="username" bind:value={username} required />
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<input id="password" name="password" type="password" bind:value={password} required />
			</div>

			{#if form?.message}
				<p class="error">{form.message}</p>
			{/if}

			<div class="actions">
				<button type="submit" class="primary">
					{isRegistering ? 'Create Account' : 'Log In'}
				</button>
				<button type="button" class="secondary" on:click={() => (isRegistering = !isRegistering)}>
					{isRegistering ? 'Already have an account? Log In' : 'Need an account? Register'}
				</button>
			</div>
		</form>

		<!-- Synchronization status message -->
		{#if syncInProgress}
			<div class="sync-message">
				<div class="spinner"></div>
				<p>Synchronizing your tasks...</p>
			</div>
		{:else if syncCount > 0}
			<div class="sync-success">
				<p>Successfully synchronized {syncCount} tasks!</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.auth-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 80vh;
	}

	.auth-box {
		background-color: white;
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		padding: 2rem;
		width: 100%;
		max-width: 400px;
	}

	h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
		color: #1f2937;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.25rem;
		font-size: 0.875rem;
		color: #4b5563;
	}

	input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.25rem;
		font-size: 0.875rem;
	}

	.error {
		color: #ef4444;
		font-size: 0.875rem;
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1.5rem;
	}

	button {
		padding: 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		cursor: pointer;
	}

	button.primary {
		background-color: #4f46e5;
		color: white;
		border: none;
	}

	button.primary:hover {
		background-color: #4338ca;
	}

	button.secondary {
		background-color: transparent;
		color: #4f46e5;
		border: 1px solid #4f46e5;
	}

	button.secondary:hover {
		background-color: #f3f4f6;
	}

	.sync-message,
	.sync-success {
		margin-top: 1rem;
		padding: 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
	}

	.sync-message {
		background-color: #f0f9ff;
		color: #0369a1;
		display: flex;
		align-items: center;
	}

	.sync-success {
		background-color: #f0fdf4;
		color: #166534;
	}

	.spinner {
		height: 1rem;
		width: 1rem;
		border-radius: 50%;
		border: 2px solid #0369a1;
		border-top-color: transparent;
		animation: spin 1s linear infinite;
		margin-right: 0.5rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
