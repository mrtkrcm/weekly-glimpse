<script lang="ts">
	import '../app.css';
	import GuestModeIndicator from '$lib/components/common/GuestModeIndicator.svelte';
	import { authStore } from '$lib/stores/authStore';

	// Initialize auth store and check session on client-side
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	onMount(() => {
		if (browser) {
			authStore.checkSession();
		}
	});
</script>

<div>
	<main>
		<slot />
	</main>
</div>

<GuestModeIndicator />
