<script>
  export let isUserLoggedIn = false
  import { page } from '$app/stores'

  let menuOpen = false

  let theme = 'dark' // Default to light mode

  // Toggle between light and dark themes
  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
  }
</script>

<nav class="navbar flex flex-none bg-base-100 px-4 py-2 shadow-lg">
  <div class="flex flex-1 items-center">
    {#if isUserLoggedIn}
      <a href="/app" class="btn btn-ghost text-xl normal-case">Warehouse</a>
      <div class="ml-4 hidden space-x-4 md:flex">
        <a href="/app" class={`btn btn-ghost`} class:btn-active={$page.url.pathname === '/app'}
          >Inventory</a
        >
        <a
          href="/app/outboundshipments"
          class={`btn btn-ghost`}
          class:btn-active={$page.url.pathname === '/app/outboundshipments'}>Outbound Shipments</a
        >
        <a
          href="/app/inboundshipments"
          class={`btn btn-ghost`}
          class:btn-active={$page.url.pathname === '/app/inboundshipments'}>Inbound Shipments</a
        >
        <a
          href="/app/clients"
          class={`btn btn-ghost`}
          class:btn-active={$page.url.pathname === '/app/clients'}>Clients</a
        >
        <a
          href="/app/invoices"
          class={`btn btn-ghost`}
          class:btn-active={$page.url.pathname === '/app/invoices'}>Invoices</a
        >
        <a
          href="/app/sku-mapping"
          class={`btn btn-ghost`}
          class:btn-active={$page.url.pathname === '/app/sku-mapping'}>Mapping</a
        >
        <a
          href="/app/inventorychangelog"
          class={`btn btn-ghost`}
          class:btn-active={$page.url.pathname === '/app/inventorychangelog'}>Changelog</a
        >
        <a
          href="/app/coupons"
          class={`btn btn-ghost`}
          class:btn-active={$page.url.pathname === '/app/coupons'}>Coupons</a
        >
      </div>
    {:else}
      <a href="/" class="btn btn-ghost text-xl normal-case">Home</a>
    {/if}
  </div>
  <div class="md:hidden">
    <button class="btn btn-ghost" on:click={() => (menuOpen = !menuOpen)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        class="inline-block h-6 w-6 stroke-current"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16m-7 6h7"
        ></path>
      </svg>
    </button>
  </div>
  <div class="hidden items-center space-x-4 md:flex">
    <!-- <div>
      <button class="btn" on:click={toggleTheme}>
        {#if theme === 'light'}
          🌙
        {:else}
          ☀️
        {/if}
      </button>
    </div> -->
    {#if isUserLoggedIn}
      <form method="post" action="/logout">
        <button type="submit" class="btn btn-primary">Logout</button>
      </form>
    {:else}
      <a href="/login" class="btn btn-secondary">Log in</a>
    {/if}
  </div>
</nav>

{#if menuOpen}
  <div
    class="absolute left-0 right-0 top-14 z-50 flex flex-col items-start bg-base-100 p-4 shadow-lg md:hidden"
  >
    <a href="/app" class={`btn btn-ghost`} class:btn-active={$page.url.pathname === '/app'}
      >Inventory</a
    >
    <a
      href="/app/outboundshipments"
      class={`btn btn-ghost`}
      class:btn-active={$page.url.pathname === '/app/outboundshipments'}>Outbound Shipments</a
    >
    <a
      href="/app/inboundshipments"
      class={`btn btn-ghost`}
      class:btn-active={$page.url.pathname === '/app/inboundshipments'}>Inbound Shipments</a
    >
    <a
      href="/app/clients"
      class={`btn btn-ghost`}
      class:btn-active={$page.url.pathname === '/app/clients'}>Clients</a
    >
    <a
      href="/app/invoices"
      class={`btn btn-ghost`}
      class:btn-active={$page.url.pathname === '/app/invoices'}>Invoices</a
    >
    <a
      href="/app/sku-mapping"
      class={`btn btn-ghost`}
      class:btn-active={$page.url.pathname === '/app/sku-mapping'}>Mapping</a
    >
    <a
      href="/app/inventorychangelog"
      class={`btn btn-ghost`}
      class:btn-active={$page.url.pathname === '/app/inventorychangelog'}>Changelog</a
    >
    {#if isUserLoggedIn}
      <form method="post" action="/logout">
        <button type="submit" class="btn btn-primary mb-2">Logout</button>
      </form>
    {:else}
      <a href="/login" class="btn btn-secondary mb-2"> Log in </a>
    {/if}
  </div>
{/if}
