<script lang="ts">
  import WeeklyCalendar from '$lib/components/WeeklyCalendar.svelte';
  import { onMount } from 'svelte';

  let tasks = [];

  onMount(async () => {
    const response = await fetch('/api/tasks');
    tasks = await response.json();
  });
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<WeeklyCalendar {tasks} />
