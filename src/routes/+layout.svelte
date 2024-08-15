<script lang="ts">
  import '@fontsource/poppins/400.css'
  import '@fontsource/poppins/600.css'
  import '@fontsource/poppins/700.css'
  import '$lib/base.css'
  import Navbar from '$lib/components/Navbar.svelte'
  import Footer from '$lib/components/Footer.svelte'
  import { onMount } from 'svelte'
  import { invalidate } from '$app/navigation'

  export let data

  $: ({ supabase, session } = data)

  onMount(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, _session) => {
      if (_session?.expires_at !== session?.expires_at) {
        // It will cause to re-run the layout load function as we added the dependency for 'supabase:auth'
        invalidate('supabase:auth')
      }
    })

    return () => subscription.unsubscribe()
  })
</script>

<div class="flex min-h-screen flex-col bg-base-200">
  <Navbar isUserLoggedIn={Boolean(session?.user)} />
  <div class="flex-grow">
    <slot />
  </div>
  <Footer />
</div>

<style global>
  body,
  html {
    margin: 0;
    padding: 0;
    height: 100%;
  }

  .flex-grow {
    flex-grow: 1;
  }
</style>
