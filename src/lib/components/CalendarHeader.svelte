<script>
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
</script>

<div class="calendar-header">
  {#each days as day}
    <div class="day">{day}</div>
  {/each}
</div>

<style>
  .calendar-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1rem;
    background: #f5f5f5;
    padding: 1rem;
    border-bottom: 1px solid #ddd;
  }
  .day {
    text-align: center;
    font-weight: bold;
  }
</style>
