<script lang="ts">
  import TaskItem from './TaskItem.svelte';
  import CalendarHeader from './CalendarHeader.svelte';
  import { dndzone } from 'svelte-dnd-action';
  import { onMount } from 'svelte';
  import io from 'socket.io-client';

  interface Task {
    id: number;
    title: string;
    description: string;
    dueDate: string;
    userId: number;
  }

  export let tasks: Task[] = [];
  let socket;

  function handleDrop(event: any) {
    const { items } = event.detail;
    tasks = items;
    socket.emit('task update', { room: 'calendar', tasks });
  }

  onMount(() => {
    socket = io();
    socket.emit('join', 'calendar');

    socket.on('task updated', (data) => {
      tasks = data.tasks;
    });

    return () => {
      socket.emit('leave', 'calendar');
      socket.disconnect();
    };
  });
</script>

<CalendarHeader />
<div class="calendar" use:dndzone={{ items: tasks, flipDurationMs: 300 }} on:consider={handleDrop} on:finalize={handleDrop} role="grid">
  {#each tasks as task}
    <TaskItem {task} />
  {/each}
</div>

<style>
  .calendar {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1rem;
    background-color: #f5f5f5; /* Ensure color contrast */
  }
</style>
