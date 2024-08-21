<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'

  // Import components
  import Loading from '$lib/components/Loading.svelte'

  // Import utility functions
  import { abbreviateString } from '$lib/utils'

  // Import props
  export let data

  // Import stores
  import { outboundShipments, loadOutboundShipments } from '$lib/stores/outboundShipments.js'

  // Execute onMount
  onMount(() => {
    loadOutboundShipments(data.supabase)
  })

  // Component specific variables and business logic

  $: {
    console.log('INBOUND SHIPMENTS', $outboundShipments)
  }

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
  <div class="ml-10 mr-10 bg-base-100 p-4 shadow-xl">
    <h1 class="mb-2 text-center text-3xl font-bold">Outbound Shipments</h1>
    <!-- <div class="mb-4 flex justify-center">
      <button
        on:click={() => (showCreateInventory = true)}
        class="btn btn-outline btn-primary btn-sm"
        >Add Product <i class="fas fa-plus"></i>
      </button>
    </div> -->
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
        {#each $outboundShipments as shipment}
          <tr>
            <td
              ><img
                class="h-12 w-12 rounded-md object-cover shadow-md"
                alt="Product Image"
                src={shipment.Product_Image_Url === null
                  ? '/placeholder-image.jpg'
                  : shipment.Product_Image_Url}
              /></td
            >
            <td>{shipment.Shipment_Number}</td>
            <td>{shipment.Carrier}</td>
            <td>{shipment.Tracking_Number}</td>
            <td>{shipment.PO_Number}</td>
            <td>{shipment.Destination}</td>
            <td>{shipment.Status}</td>
            <td>{shipment.Date_Of_Last_Change}</td>
            <td
              ><div
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
              </div></td
            >
            <td>{shipment.Sku}</td>
            <td>{shipment.Quantity}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
