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

<div class="hero flex min-h-screen flex-col items-center bg-base-200 pt-12">
  <div class="hero-content text-center">
    <div class="max-w-xl">
      <h1 class="text-2xl font-bold">Welcome, {data.session.user.email}</h1>
    </div>
  </div>
</div>
