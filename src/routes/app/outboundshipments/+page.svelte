<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'

  // Import components
  import Loading from '$lib/components/Loading.svelte'

  // Import utility functions
  import { abbreviateString, formatDate } from '$lib/utils'

  // Import props
  export let data

  // Import stores
  import { outboundShipments, loadOutboundShipments } from '$lib/stores/outboundShipments.js'

  // Execute onMount
  onMount(() => {
    loadOutboundShipments(data.supabase)
  })

  // Component specific variables and business logic

  $: outboundShipmentsByMostRecent = $outboundShipments.sort(
    (a, b) => new Date(b.Date_Of_Last_Change) - new Date(a.Date_Of_Last_Change),
  )

  let loading = false

  let hoveredTitleId = null
  let timer
  let searchQuery = ''

  function handleMouseEnter(id) {
    timer = setTimeout(() => {
      hoveredTitleId = id
    }, 1000)
  }

  function handleMouseLeave() {
    clearTimeout(timer)
    hoveredTitleId = null
  }

  // Filtered shipments based on search query, handle null values safely
  $: filteredShipments = outboundShipmentsByMostRecent.filter((shipment) =>
    shipment.Shipment_Number?.toLowerCase().includes(searchQuery.toLowerCase()),
  )
</script>

<Loading {loading} />
<div class="mt-10 flex justify-center">
  <div class="ml-5 mr-5 w-full max-w-7xl bg-base-100 p-4 shadow-xl">
    <h1 class="mb-5 text-center text-3xl font-bold">Outbound Shipments</h1>

    <!-- Search input -->
    <div class="mb-4 flex justify-center">
      <input
        type="text"
        class="input w-1/4 bg-base-200"
        placeholder="Search by Shipment Number"
        bind:value={searchQuery}
      />
      <button class="btn btn-primary">Search</button>
    </div>

    <div class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Product Image</th>
            <th>Shipment Number</th>
            <th>Carrier</th>
            <th>Tracking Number</th>
            <th>PO Number</th>
            <th>Destination</th>
            <th>Status</th>
            <th>Order Date</th>
            <th>Product Title</th>
            <th>Sku</th>
            <th>Product Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredShipments as shipment}
            <tr>
              <td>
                <img
                  class="h-12 w-12 rounded-md object-cover shadow-md"
                  alt="Product Image"
                  src={shipment.Product_Image_Url === null
                    ? '/placeholder-image.jpg'
                    : shipment.Product_Image_Url}
                />
              </td>
              <td>{shipment.Shipment_Number}</td>
              <td>{shipment.Carrier}</td>
              <td>{shipment.Tracking_Number}</td>
              <td>{shipment.PO_Number}</td>
              <td>{shipment.Destination}</td>
              <td>{shipment.Status}</td>
              <td>{formatDate(shipment.Date_Of_Last_Change)}</td>
              <td>
                <div
                  class="tooltip"
                  role="tooltip"
                  on:mouseenter={() => handleMouseEnter(shipment['Product_Title'])}
                  on:mouseleave={handleMouseLeave}
                >
                  {abbreviateString(shipment['Product_Title'], 25)}
                  {#if hoveredTitleId === shipment['Product_Title']}
                    <span class="tooltip-text">
                      {shipment['Product_Title']}...
                    </span>
                  {/if}
                </div>
              </td>
              <td>
                <div
                  class="tooltip"
                  role="tooltip"
                  on:mouseenter={() => handleMouseEnter(shipment.Sku)}
                  on:mouseleave={handleMouseLeave}
                >
                  {abbreviateString(shipment.Sku, 15)}
                  {#if hoveredTitleId === shipment.Sku}
                    <span class="tooltip-text">
                      {shipment.Sku}...
                    </span>
                  {/if}
                </div>
              </td>
              <td>{shipment.Quantity}</td>
              <td>
                <div>
                  <button class="btn btn-info btn-xs mb-2">Edit</button>
                  <button class="btn btn-primary btn-xs mb-2">Update Tracking</button>
                  <button class="btn btn-error btn-xs">Delete</button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
