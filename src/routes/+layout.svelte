<script context="module" lang="ts">
  import { auth } from '$lib/server/auth';
  import { handle } from '@sveltejs/kit';

  export const handle = auth.handle;
</script>

<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

{@render children()}
