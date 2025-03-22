<script lang="ts">
  import { onMount } from 'svelte';

  export let task: { title: string; description: string };

  onMount(() => {
    if (typeof window !== 'undefined') {
      import('hammerjs').then(Hammer => {
        const taskItem = document.querySelector('.task-item') as HTMLElement;
        if (taskItem) {
          const hammer = new Hammer.default(taskItem);

          hammer.on('swipeleft', () => {
            console.log('Swiped left');
          });

          hammer.on('swiperight', () => {
            console.log('Swiped right');
          });
        }
      });
    }
  });
</script>

<div class="task-item" role="gridcell">
  <h3>{task.title}</h3>
  <p>{task.description}</p>
</div>

<style>
  .task-item {
    background: #fff;
    border: 1px solid #ddd;
    padding: 1rem;
    border-radius: 0.5rem;
    color: #333; /* Ensure color contrast */
  }
</style>
