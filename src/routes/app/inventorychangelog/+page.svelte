<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'

  // Import props
  export let data

  // Import utils
  import { formatTimeStampForChangelog, abbreviateString } from '$lib/utils.js'

  // Import stores
  import { inventoryChangelog, loadInventoryChangelog } from '$lib/stores/inventoryChangelog.js'

  // Execute onMount
  onMount(() => {
    loadInventoryChangelog(data.supabase)
  })

  // Component specific variables and business logic

  let hoveredTitleId = null
  let timer

  function handleMouseEnter(id) {
    timer = setTimeout(() => {
      hoveredTitleId = id
    }, 1000)
  }

  function handleMouseLeave() {
    clearTimeout(timer)
    hoveredTitleId = null
  }
</script>

<div class="mt-10 flex justify-center">
  <div class="ml-10 mr-10 w-full rounded-lg bg-base-100 p-4 shadow-xl">
    <h1 class="mb-5 text-center text-3xl font-bold">Inventory Changelog</h1>
    <div class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Client Id</th>
            <th>Change Source</th>
            <th>Name</th>
            <th>Asin</th>
            <th>Sku</th>
            <th>Previous Quantity</th>
            <th>New Quantity</th>
            <th>Net Change</th>
          </tr>
        </thead>
        <tbody>
          {#each $inventoryChangelog as log}
            <tr>
              <td>{formatTimeStampForChangelog(log?.created_at)}</td>
              <td>{log?.client_id}</td>
              <td>{log?.change_source}</td>
              <td
                ><div
                  class="tooltip"
                  role="tooltip"
                  on:mouseenter={() => handleMouseEnter(log?.name)}
                  on:mouseleave={handleMouseLeave}
                >
                  {abbreviateString(log?.name, 25)}
                  {#if hoveredTitleId === log?.name}
                    <div
                      class="absolute left-0 top-full z-50 mt-2 rounded-lg bg-gray-200 p-2 text-gray-800 opacity-100 shadow-lg"
                      style="opacity: 1; background-color: rgba(229, 231, 235, 1);"
                    >
                      {log?.name}
                    </div>
                  {/if}
                </div>
              </td>
              <td>{log?.asin}</td>
              <td>{log?.sku}</td>
              <td>{log?.previous_quantity}</td>
              <td>{log?.new_quantity}</td>
              <td
                class:text-green-600={log?.new_quantity - log?.previous_quantity > 0}
                class:text-error={log?.new_quantity - log?.previous_quantity < 0}
                >{log?.new_quantity - log?.previous_quantity}</td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
