<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'

  // Import components
  import Loading from '$lib/components/Loading.svelte'

  // Import utility functions
  import { abbreviateString, formatDate } from '$lib/utils'

  // Import props
  export let data

  // Import stores
  import { inboundShipments, loadInboundShipments } from '$lib/stores/inboundShipments.js'
  import { inventory, loadInventory } from '$lib/stores/inventory.js'

  // Execute onMount
  onMount(() => {
    loadInboundShipments(data.supabase)
  })

  // Component specific variables and business logic

  let loading = false

  let showDeleteInboundShipment = false
  let inboundShipmentToDelete = {}

  async function deleteInboundShipment(id, createdAt) {
    loading = true
    const response = await fetch('/app/api/inboundshipments/deleteShipment', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        createdAt,
      }),
    })
    if (response.ok) {
      loadInboundShipments(data.supabase)
      inboundShipmentToDelete = {}
    } else {
      const errorData = await response.json()
      alert(`Failed to delete inboundShipments: ${errorData.message}`)
    }
    inboundShipmentToDelete = {}
    showDeleteInboundShipment = false
    loading = false
  }

  // Shipment field
  let id = 0
  let clientId = ''
  let shipmentNumber = ''
  let bolNumber = ''
  let carrier = ''
  let trackingNumber = ''
  let destination = ''
  let shipmentType = ''
  let status = ''
  let dateOfLastChange = ''
  let asin = ''
  let productTitle = ''
  let sku = ''
  let productImageUrl = ''
  let quantity = 0
  let countedQuantity = 0
  let warehouseAddress = '2821 West P Circle'
  let warehousePostalCode = '68528'
  let warehouseCity = 'Lincoln'
  let warehouseState = 'NE'

  const destinations = ['Hometown Warehouse']

  let showEditInboundShipment = false
  let inboundShipmentToEdit = {}

  async function editInboundShipment() {
    loading = true
    const id = inboundShipmentToEdit.id
    const createdAt = inboundShipmentToEdit.created_at
    const response = await fetch('/app/api/inboundshipments/editShipment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        createdAt,
        clientId,
        shipmentNumber,
        bolNumber,
        carrier,
        trackingNumber,
        destination,
        shipmentType,
        status,
        dateOfLastChange,
        asin,
        productTitle,
        sku,
        productImageUrl,
        quantity,
        countedQuantity,
        warehouseAddress,
        warehousePostalCode,
        warehouseCity,
        warehouseState,
      }),
    })
    if (response.ok) {
      loadInboundShipments(data.supabase)
      showEditInboundShipment = false
      inboundShipmentToEdit = {}
      clientId = ''
      shipmentNumber = ''
      bolNumber = ''
      carrier = ''
      trackingNumber = ''
      destination = ''
      shipmentType = ''
      status = ''
      dateOfLastChange = ''
      asin = ''
      productTitle = ''
      sku = ''
      productImageUrl = ''
      quantity = 0
      countedQuantity = 0
      warehouseAddress = '2821 West P Circle'
      warehousePostalCode = '68528'
      warehouseCity = 'Lincoln'
      warehouseState = 'NE'
    } else {
      const errorData = await response.json()
      alert(`Failed to edit inbound shipment: ${errorData.message}`)
    }
    loading = false
  }

  let showCountFields = false
  async function confirmCountAndSendNotification() {
    loading = true
    // Send email notifying that a client has created a shipment
    await fetch('/app/api/notifications/sendCountConfirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        shipmentNumber,
        sku,
        productTitle,
        quantity,
        countedQuantity,
      }),
    })
    // Update counted quantity field
    const response = await fetch('/app/api/inboundshipments/confirmCount', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        countedQuantity,
      }),
    })
    if (response.ok) {
      loadInboundShipments(data.supabase)
      loadInventory(data.supabase)
      clientId = ''
      sku = ''
      shipmentNumber = ''
      productTitle = ''
      quantity = 0
      countedQuantity = 0
      id = 0
    } else {
      const errorData = await response.json()
      alert(`Failed to update tracking for shipment: ${errorData.message}`)
    }
    showCountFields = false
    loading = false
  }

  $: inboundShipmentsByMostRecent = $inboundShipments.sort(
    (a, b) => new Date(b.Date_Of_Last_Change) - new Date(a.Date_Of_Last_Change),
  )

  let shipmentStatus = 'Pending'

  $: pendingShipments = inboundShipmentsByMostRecent.filter(
    (shipment) => shipment.Status === 'Pending',
  )

  $: receivedShipments = inboundShipmentsByMostRecent.filter(
    (shipment) => shipment.Status === 'Received',
  )

  // Filtered shipments based on search query, handle null values safely
  $: filteredShipments = inboundShipmentsByMostRecent.filter((shipment) =>
    shipment.Shipment_Number?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
</script>

<Loading {loading} />
<div class="mt-10 flex justify-center">
  <div class="ml-5 mr-5 w-full max-w-7xl bg-base-100 p-4 shadow-xl">
    <h1 class="mb-5 text-center text-3xl font-bold">{shipmentStatus} Inbound Shipments</h1>

    <div class="mb-4 flex justify-center">
      <button
        on:click={() => (shipmentStatus = 'Pending')}
        class:btn-active={shipmentStatus === 'Pending'}
        class="btn">Pending</button
      >
      <button
        on:click={() => (shipmentStatus = 'Received')}
        class:btn-active={shipmentStatus === 'Received'}
        class="btn">Received</button
      >
    </div>

    <!-- Search input -->
    <!-- <div class="mb-4 flex justify-center">
      <input
        type="text"
        class="input w-1/4 bg-base-200"
        placeholder="Search by Shipment Number"
        bind:value={searchQuery}
      />
      <button class="btn btn-primary">Search</button>
    </div> -->

    <div class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Product Image</th>
            <th>Shipment Number</th>
            <th>BOL Number</th>
            <th>Carrier</th>
            <th>Tracking Number</th>
            <th>Status</th>
            <th>Order Date</th>
            <th>Product Title</th>
            <th>Sku</th>
            <th>Product Quantity</th>
            <th>Counted Quantity</th>
            <th>Shipping Discrepancy</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each shipmentStatus === 'Pending' ? pendingShipments : receivedShipments as shipment}
            <tr id={shipment.id}>
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
              <td>{shipment.BOL_Number}</td>
              <td>{shipment.Carrier}</td>
              <td>{shipment.Tracking_Number}</td>
              <td
                ><button
                  class:btn-accent={shipmentStatus === 'Received'}
                  class:btn-warning={shipmentStatus === 'Pending'}
                  class="btn btn-sm">{shipment.Status}</button
                ></td
              >
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
              <td>{shipment.Counted_Quantity}</td>
              <td>{shipment.Quantity - shipment.Counted_Quantity}</td>
              <td>
                <div>
                  <button
                    on:click={() => {
                      showEditInboundShipment = true
                      inboundShipmentToEdit = shipment
                      clientId = shipment.Client_Id
                      shipmentNumber = shipment.Shipment_Number
                      carrier = shipment.Carrier
                      trackingNumber = shipment.Tracking_Number
                      bolNumber = shipment.BOL_Number
                      destination = shipment.Destination
                      shipmentType = shipment.Shipment_Type
                      status = shipment.Status
                      dateOfLastChange = shipment.Date_Of_Last_Change
                      asin = shipment.Asin
                      productTitle = shipment.Product_Title
                      sku = shipment.Sku
                      productImageUrl = shipment.Product_Image_Url
                      quantity = shipment.Quantity
                      countedQuantity = shipment.Counted_Quantity
                    }}
                    class="btn btn-info btn-xs mb-2">Edit</button
                  >
                  <button
                    on:click={() => {
                      showCountFields = true
                      clientId = shipment.Client_Id
                      sku = shipment.Sku
                      shipmentNumber = shipment.Shipment_Number
                      productTitle = shipment.Product_Title
                      quantity = shipment.Quantity
                      countedQuantity = 0
                      id = shipment.id
                    }}
                    class="btn btn-primary btn-xs mb-2">Confirm Count</button
                  >
                  <button
                    on:click={() => {
                      showDeleteInboundShipment = true
                      inboundShipmentToDelete = shipment
                    }}
                    class="btn btn-error btn-xs">Delete</button
                  >
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- DELETE SHIPMENT MODAL BEGINS -->
<div class={`modal ${showDeleteInboundShipment ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (showDeleteInboundShipment = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mt-2 text-center text-lg font-bold">
      Are you sure you want to delete this Shipment?
    </h1>
    <p class="entry-content py-4 text-center" style="white-space: pre-line;">
      {inboundShipmentToDelete.Shipment_Number}
    </p>
    <div class="flex justify-center">
      <button
        on:click={() =>
          deleteInboundShipment(inboundShipmentToDelete.id, inboundShipmentToDelete.created_at)}
        class="btn btn-error"
      >
        Yes, Delete
      </button>
    </div>
  </div>
</div>
<!-- DELETE SHIPMENT MODAL ENDS -->

<!-- EDIT SHIPMENT MODAL BEGINS -->
<div class={`modal ${showEditInboundShipment ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (showEditInboundShipment = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Edit Outbound Shipment</h1>
    <form on:submit={editInboundShipment}>
      <!-- Client ID -->
      <div class="form-control mb-4">
        <label class="label" for="clientId">Client ID</label>
        <input
          required
          class="input input-bordered bg-base-200"
          type="text"
          id="clientId"
          bind:value={clientId}
          placeholder="Client ID"
        />
      </div>

      <!-- Shipment Number -->
      <div class="form-control mb-4">
        <label class="label" for="shipmentNumber">Shipment Number</label>
        <input
          required
          class="input input-bordered bg-base-200"
          type="text"
          id="shipmentNumber"
          bind:value={shipmentNumber}
          placeholder="Shipment Number"
        />
      </div>

      <!-- Carrier -->
      <div class="form-control mb-4">
        <label class="label" for="carrier">Carrier</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="carrier"
          bind:value={carrier}
          placeholder="Carrier"
        />
      </div>

      <!-- Tracking Number -->
      <div class="form-control mb-4">
        <label class="label" for="trackingNumber">Tracking Number</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="trackingNumber"
          bind:value={trackingNumber}
          placeholder="Tracking Number"
        />
      </div>

      <!-- PO Number -->
      <div class="form-control mb-4">
        <label class="label" for="bolNumber">BOL Number</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="bolNumber"
          bind:value={bolNumber}
          placeholder="BOL Number"
        />
      </div>

      <!-- Destination -->
      <div class="form-control mb-4">
        <label class="label" for="destination">Destination</label>
        <select
          class="select select-bordered bg-base-200"
          id="destination"
          bind:value={destination}
        >
          {#each destinations as destinationOption}
            <option value={destinationOption}>{destinationOption}</option>
          {/each}
        </select>
      </div>

      <!-- Shipment Type -->
      <div class="form-control mb-4">
        <label class="label" for="shipmentType">Shipment Type</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="shipmentType"
          bind:value={shipmentType}
          placeholder="Shipment Type"
        />
      </div>

      <!-- Status -->
      <div class="form-control mb-4">
        <label class="label" for="status">Status</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="status"
          bind:value={status}
          placeholder="Status"
        />
      </div>

      <!-- Date of Last Change -->
      <div class="form-control mb-4">
        <label class="label" for="dateOfLastChange">Date of Last Change</label>
        <input
          required
          class="input input-bordered bg-base-200"
          type="text"
          id="dateOfLastChange"
          bind:value={dateOfLastChange}
          placeholder="MM/DD/YYYY"
        />
      </div>

      <!-- ASIN -->
      <div class="form-control mb-4">
        <label class="label" for="asin">ASIN</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="asin"
          bind:value={asin}
          placeholder="ASIN"
        />
      </div>

      <!-- Product Title -->
      <div class="form-control mb-4">
        <label class="label" for="productTitle">Product Title</label>
        <textarea
          class="textarea textarea-bordered bg-base-200"
          id="productTitle"
          bind:value={productTitle}
          placeholder="Product Title"
        ></textarea>
      </div>

      <!-- SKU -->
      <div class="form-control mb-4">
        <label class="label" for="sku">SKU</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="sku"
          bind:value={sku}
          placeholder="SKU"
        />
      </div>

      <!-- Product Image URL -->
      <div class="form-control mb-4">
        <label class="label" for="productImageUrl">Product Image URL</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="productImageUrl"
          bind:value={productImageUrl}
          placeholder="Product Image URL"
        />
      </div>

      <!-- Quantity -->
      <div class="form-control mb-4">
        <label class="label" for="quantity">Quantity</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="quantity"
          bind:value={quantity}
          placeholder="Total Quantity"
        />
      </div>

      <!-- Counted Quantity -->
      <div class="form-control mb-4">
        <label class="label" for="countedQuantity">Counted Quantity</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="countedQuantity"
          bind:value={countedQuantity}
          placeholder="0"
        />
      </div>

      <!-- Warehouse Address -->
      <div class="form-control mb-4">
        <label class="label" for="warehouseAddress">Warehouse Address</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="warehouseAddress"
          bind:value={warehouseAddress}
          placeholder="Warehouse Address"
        />
      </div>

      <!-- Warehouse City -->
      <div class="form-control mb-4">
        <label class="label" for="warehouseCity">Warehouse City</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="warehouseCity"
          bind:value={warehouseCity}
          placeholder="Warehouse City"
        />
      </div>

      <!-- Warehouse State -->
      <div class="form-control mb-4">
        <label class="label" for="warehouseState">Warehouse State</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="warehouseState"
          bind:value={warehouseState}
          placeholder="Warehouse State"
        />
      </div>

      <!-- Warehouse Postal Code -->
      <div class="form-control mb-4">
        <label class="label" for="warehousePostalCode">Warehouse Postal Code</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="warehousePostalCode"
          bind:value={warehousePostalCode}
          placeholder="Warehouse Postal Code"
        />
      </div>

      <!-- Submit Button -->
      <div class="mt-4 flex justify-center">
        <button class="btn btn-info" type="submit">Save</button>
      </div>
    </form>
  </div>
</div>
<!-- EDIT SHIPMENT MODAL ENDS -->

<!-- Confirm Count MODAL BEGINS -->
<div class={`modal ${showCountFields ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (showCountFields = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 mt-5 text-center text-xl font-semibold">
      Confirm Count - {shipmentNumber}
    </h1>
    <form on:submit={confirmCountAndSendNotification}>
      <!-- quantity -->
      <div class="form-control mb-4">
        <label class="label" for="quantity">Expected Quantity</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="quantity"
          bind:value={quantity}
          placeholder="quantity"
        />
      </div>

      <!-- counted quantity -->
      <div class="form-control mb-4">
        <label class="label" for="countedQuantity">Counted Quantity</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="countedQuantity"
          bind:value={countedQuantity}
          on:input={(e) => (countedQuantity = Number(e.target.value) || 0)}
          placeholder="0"
        />
      </div>

      <!-- Submit Button -->
      <div class="mt-4 mt-5 flex justify-center">
        <button class="btn btn-info" type="submit">Confirm Count and Send Notification</button>
      </div>
    </form>
  </div>
</div>
<!-- Confirm Count MODAL ENDS -->
