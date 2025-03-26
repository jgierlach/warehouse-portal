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

<div class="mt-4 flex justify-center px-2 sm:px-4 md:mt-10">
  <div class="w-full max-w-7xl rounded-lg bg-base-100 p-2 shadow-xl sm:p-4">
    <h1 class="mb-3 text-center text-2xl font-bold sm:mb-5 sm:text-3xl">Inventory Changelog</h1>

    <!-- Table for medium screens and up -->
    <div class="hidden overflow-x-auto md:block">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Client Id</th>
            <th>Shipment #</th>
            <th>Change Source</th>
            <th>Name</th>
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
              <td>{log?.shipment_number === null ? 'N/A' : log?.shipment_number}</td>
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

    <!-- Card layout for small screens -->
    <div class="grid grid-cols-1 gap-4 md:hidden">
      {#each $inventoryChangelog as log}
        <div class="card bg-base-200 shadow-md">
          <div class="card-body p-4">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-md font-bold">
                  <div
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
                </h3>
                <p class="text-sm">SKU: {log?.sku}</p>
              </div>
              <div
                class="badge badge-lg ml-2"
                class:badge-success={log?.new_quantity - log?.previous_quantity > 0}
                class:badge-error={log?.new_quantity - log?.previous_quantity < 0}
                class:badge-ghost={log?.new_quantity - log?.previous_quantity === 0}
              >
                {log?.new_quantity - log?.previous_quantity > 0 ? '+' : ''}{log?.new_quantity -
                  log?.previous_quantity}
              </div>
            </div>

            <div class="divider my-1"></div>

            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span class="font-semibold">Time:</span><br />
                {formatTimeStampForChangelog(log?.created_at)}
              </div>
              <div>
                <span class="font-semibold">Client:</span><br />
                {log?.client_id}
              </div>
              <div>
                <span class="font-semibold">Source:</span><br />
                {log?.change_source}
              </div>
              <div>
                <span class="font-semibold">Previous Qty:</span><br />
                {log?.previous_quantity}
              </div>
              <div>
                <span class="font-semibold">New Qty:</span><br />
                {log?.new_quantity}
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
