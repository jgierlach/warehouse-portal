<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'

  // Import components
  import Navbar from '$lib/components/Navbar.svelte'

  // Import utility functions
  import { test } from '$lib/utils'

  // Import props
  export let data

  // Import stores
  import { testStore, loadTestStore } from '$lib/stores/test'

  // Execute onMount
  onMount(() => {
    loadTestStore()
  })

  // Component specific variables and business logic
</script>

<div class="hero min-h-screen bg-base-200">
  <div class="hero-content text-center">
    <div class="max-w-md">
      <h1 class="text-5xl font-bold">About Page</h1>
    </div>
  </div>
</div>
