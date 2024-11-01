<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'

  // Import props
  export let data

  // Import utils
  import { formatTimeStampForChangelog } from '$lib/utils.js'

  // Import stores
  import { inventoryChangelog, loadInventoryChangelog } from '$lib/stores/inventoryChangelog.js'

  // Component specific variables and business logic

  // Execute onMount
  onMount(() => {
    loadInventoryChangelog(data.supabase)
  })
</script>

<div class="mt-10 flex justify-center">
  <div class="ml-10 mr-10 w-full bg-base-100 p-4 shadow-xl">
    <h1 class="mb-5 text-center text-3xl font-bold">Inventory Changelog</h1>
    <div class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Client Id</th>
            <th>Name</th>
            <th>Asin</th>
            <th>Sku</th>
            <th>Previous Quantity</th>
            <th>New Quantity</th>
            <th>Previous Pending</th>
            <th>New Pending</th>
          </tr>
        </thead>
        <tbody>
          {#each $inventoryChangelog as log}
            <tr>
              <td>{formatTimeStampForChangelog(log.created_at)}</td>
              <td>{log.client_id}</td>
              <td>{log.name}</td>
              <td>{log.asin}</td>
              <td>{log.sku}</td>
              <td>{log.previous_quantity}</td>
              <td>{log.new_quantity}</td>
              <td>{log.previous_pending}</td>
              <td>{log.new_pending}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
