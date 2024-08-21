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

<Loading {loading} />
<div class="mt-10 flex justify-center">
  <div class="ml-5 mr-5 w-full max-w-6xl bg-base-100 p-4 shadow-xl">
    <h1 class="mb-2 text-center text-3xl font-bold">Outbound Shipments</h1>
    <div class="overflow-x-auto">
      <table class="table table-zebra w-full">
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
          {#each outboundShipmentsByMostRecent as shipment}
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
              <td>{shipment.Sku}</td>
              <td>{shipment.Quantity}</td>
              <td class="flex justify-center">
                <button class="btn btn-outline btn-info btn-sm mr-2">Edit</button>
                <button class="btn btn-outline btn-primary btn-sm mr-2">Update Tracking</button>
                <button class="btn btn-outline btn-error btn-sm">Delete</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
