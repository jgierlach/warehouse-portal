<script>
  export let loading = false
</script>

{#if loading}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50">
    <div class="h-16 w-16 animate-spin rounded-full border-4 border-dashed border-blue-500"></div>
  </div>
{/if}
