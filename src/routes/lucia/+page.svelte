<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let error = '';

  async function login() {
    const response = await fetch('/lucia', {
      method: 'POST',
      body: new URLSearchParams({ email, password }),
    });

    if (response.ok) {
      goto('/');
    } else {
      const result = await response.json();
      error = result.error;
    }
  }
</script>

<form on:submit|preventDefault={login}>
  <label for="email">Email</label>
  <input type="email" id="email" bind:value={email} required />

  <label for="password">Password</label>
  <input type="password" id="password" bind:value={password} required />

  {#if error}
    <p>{error}</p>
  {/if}

  <button type="submit">Login</button>
</form>
