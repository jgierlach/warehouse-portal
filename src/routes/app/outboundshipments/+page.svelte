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

  let loading = false

  let showDeleteOutboundShipment = false
  let outboundShipmentToDelete = {}

  async function deleteOutboundShipment(id, createdAt) {
    loading = true
    const response = await fetch('/app/api/outboundshipments/deleteShipment', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        createdAt,
      }),
    })
    if (response.ok) {
      loadOutboundShipments(data.supabase)
      outboundShipmentToDelete = {}
    } else {
      const errorData = await response.json()
      alert(`Failed to delete outboundshipments: ${errorData.message}`)
    }
    outboundShipmentToDelete = {}
    showDeleteOutboundShipment = false
    loading = false
  }

  // Shipment fields
  let clientId = ''
  let shipmentNumber = ''
  let carrier = ''
  let trackingNumber = ''
  let poNumber = ''
  let destination = ''
  let requiresAmazonLabeling = ''
  let shipmentType = ''
  let status = ''
  let dateOfLastChange = ''
  let asin = ''
  let productTitle = ''
  let sku = ''
  let productImageUrl = ''
  let quantity = 0
  let buyerName = ''
  let buyerEmail = ''
  let recipientName = ''
  let recipientCompany = ''
  let recipientAddressLine1 = ''
  let recipientCity = ''
  let recipientState = ''
  let recipientPostalCode = ''

  const destinations = [
    'Website Customer Order',
    'B2B Order',
    'Amazon FBA',
    'Chewy.com',
    'Walmart Customer Order',
  ]

  let showEditOutboundShipment = false
  let outboundShipmentToEdit = {}

  async function editOutboundShipment() {
    loading = true
    const id = outboundShipmentToEdit.id
    const createdAt = outboundShipmentToEdit.created_at
    const response = await fetch('/app/api/outboundshipments/editShipment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        createdAt,
        clientId,
        shipmentNumber,
        carrier,
        trackingNumber,
        poNumber,
        destination,
        requiresAmazonLabeling,
        shipmentType,
        status,
        dateOfLastChange,
        asin,
        productTitle,
        sku,
        productImageUrl,
        quantity,
        buyerName,
        buyerEmail,
        recipientName,
        recipientCompany,
        recipientAddressLine1,
        recipientCity,
        recipientState,
        recipientPostalCode,
      }),
    })
    if (response.ok) {
      loadOutboundShipments(data.supabase)
      showEditOutboundShipment = false
      outboundShipmentToEdit = {}
      clientId = ''
      shipmentNumber = ''
      carrier = ''
      trackingNumber = ''
      poNumber = ''
      destination = ''
      requiresAmazonLabeling = ''
      shipmentType = ''
      status = ''
      dateOfLastChange = ''
      asin = ''
      productTitle = ''
      sku = ''
      productImageUrl = ''
      quantity = 0
      buyerName = ''
      buyerEmail = ''
      recipientName = ''
      recipientCompany = ''
      recipientAddressLine1 = ''
      recipientCity = ''
      recipientState = ''
      recipientPostalCode = ''
    } else {
      const errorData = await response.json()
      alert(`Failed to edit outbound shipment: ${errorData.message}`)
    }
    loading = false
  }

  let showTrackingFields = false
  async function updateTrackingInformationAndSendNotification() {
    loading = true
    // Send email notifying that a client has created a shipment
    await fetch('/app/api/notifications/sendTrackingInformation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        shipmentNumber,
        carrier,
        trackingNumber,
        poNumber,
        recipientName,
      }),
    })
    // Edit Carrier and tracking fields
    await editOutboundShipment()
    showTrackingFields = false
    loading = false
  }

  $: outboundShipmentsByMostRecent = $outboundShipments.sort(
    (a, b) => new Date(b.Date_Of_Last_Change) - new Date(a.Date_Of_Last_Change),
  )

  // Filtered shipments based on search query, handle null values safely
  $: filteredShipments = outboundShipmentsByMostRecent.filter((shipment) =>
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
                  <button
                    on:click={() => {
                      showEditOutboundShipment = true
                      outboundShipmentToEdit = shipment
                      clientId = shipment.Client_Id
                      shipmentNumber = shipment.Shipment_Number
                      carrier = shipment.Carrier
                      trackingNumber = shipment.Tracking_Number
                      poNumber = shipment.PO_Number
                      destination = shipment.Destination
                      requiresAmazonLabeling = shipment.Requires_Amazon_Labeling
                      shipmentType = shipment.Shipment_Type
                      status = shipment.Status
                      dateOfLastChange = shipment.Date_Of_Last_Change
                      asin = shipment.Asin
                      productTitle = shipment.Product_Title
                      sku = shipment.Sku
                      productImageUrl = shipment.Product_Image_Url
                      quantity = shipment.Quantity
                      buyerName = shipment.Buyer_Name
                      buyerEmail = shipment.Buyer_Email
                      recipientName = shipment.Recipient_Name
                      recipientCompany = shipment.Recipient_Company
                      recipientAddressLine1 = shipment.Recipient_Address_Line_1
                      recipientCity = shipment.Recipient_City
                      recipientState = shipment.Recipient_State
                      recipientPostalCode = shipment.Recipient_Postal_Code
                    }}
                    class="btn btn-info btn-xs mb-2">Edit</button
                  >
                  <button
                    on:click={() => {
                      showTrackingFields = true
                      outboundShipmentToEdit = shipment
                      clientId = shipment.Client_Id
                      shipmentNumber = shipment.Shipment_Number
                      carrier = shipment.Carrier
                      trackingNumber = shipment.Tracking_Number
                      poNumber = shipment.PO_Number
                      destination = shipment.Destination
                      requiresAmazonLabeling = shipment.Requires_Amazon_Labeling
                      shipmentType = shipment.Shipment_Type
                      status = shipment.Status
                      dateOfLastChange = shipment.Date_Of_Last_Change
                      asin = shipment.Asin
                      productTitle = shipment.Product_Title
                      sku = shipment.Sku
                      productImageUrl = shipment.Product_Image_Url
                      quantity = shipment.Quantity
                      buyerName = shipment.Buyer_Name
                      buyerEmail = shipment.Buyer_Email
                      recipientName = shipment.Recipient_Name
                      recipientCompany = shipment.Recipient_Company
                      recipientAddressLine1 = shipment.Recipient_Address_Line_1
                      recipientCity = shipment.Recipient_City
                      recipientState = shipment.Recipient_State
                      recipientPostalCode = shipment.Recipient_Postal_Code
                    }}
                    class="btn btn-primary btn-xs mb-2">Update Tracking</button
                  >
                  <button
                    on:click={() => {
                      showDeleteOutboundShipment = true
                      outboundShipmentToDelete = shipment
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
<div class={`modal ${showDeleteOutboundShipment ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (showDeleteOutboundShipment = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mt-2 text-center text-lg font-bold">
      Are you sure you want to delete this Shipment?
    </h1>
    <p class="entry-content py-4 text-center" style="white-space: pre-line;">
      {outboundShipmentToDelete.Shipment_Number}
    </p>
    <div class="flex justify-center">
      <button
        on:click={() =>
          deleteOutboundShipment(outboundShipmentToDelete.id, outboundShipmentToDelete.created_at)}
        class="btn btn-error"
      >
        Yes, Delete
      </button>
    </div>
  </div>
</div>
<!-- DELETE SHIPMENT MODAL ENDS -->

<!-- EDIT SHIPMENT MODAL BEGINS -->
<div class={`modal ${showEditOutboundShipment ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (showEditOutboundShipment = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Edit Outbound Shipment</h1>
    <form on:submit={editOutboundShipment}>
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
        <label class="label" for="poNumber">PO Number</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="poNumber"
          bind:value={poNumber}
          placeholder="PO Number"
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

      <!-- Requires Amazon Labeling -->
      <div class="form-control mb-4">
        <label class="label" for="requiresAmazonLabeling">Requires Amazon Labeling</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="requiresAmazonLabeling"
          bind:value={requiresAmazonLabeling}
        />
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

      <!-- Buyer Name -->
      <div class="form-control mb-4">
        <label class="label" for="buyerName">Buyer Name</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="buyerName"
          bind:value={buyerName}
          placeholder="Buyer Name"
        />
      </div>

      <!-- Buyer Email -->
      <div class="form-control mb-4">
        <label class="label" for="buyerEmail">Buyer Email</label>
        <input
          class="input input-bordered bg-base-200"
          type="email"
          id="buyerEmail"
          bind:value={buyerEmail}
          placeholder="Buyer Email"
        />
      </div>

      <!-- Recipient Name -->
      <div class="form-control mb-4">
        <label class="label" for="recipientName">Recipient Name</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="recipientName"
          bind:value={recipientName}
          placeholder="Recipient Name"
        />
      </div>

      <!-- Recipient Company -->
      <div class="form-control mb-4">
        <label class="label" for="recipientCompany">Recipient Company</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="recipientCompany"
          bind:value={recipientCompany}
          placeholder="Recipient Company"
        />
      </div>

      <!-- Recipient Address Line 1 -->
      <div class="form-control mb-4">
        <label class="label" for="recipientAddressLine1">Recipient Address Line 1</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="recipientAddressLine1"
          bind:value={recipientAddressLine1}
          placeholder="Recipient Address Line 1"
        />
      </div>

      <!-- Recipient City -->
      <div class="form-control mb-4">
        <label class="label" for="recipientCity">Recipient City</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="recipientCity"
          bind:value={recipientCity}
          placeholder="Recipient City"
        />
      </div>

      <!-- Recipient State -->
      <div class="form-control mb-4">
        <label class="label" for="recipientState">Recipient State</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="recipientState"
          bind:value={recipientState}
          placeholder="Recipient State"
        />
      </div>

      <!-- Recipient Postal Code -->
      <div class="form-control mb-4">
        <label class="label" for="recipientPostalCode">Recipient Postal Code</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="recipientPostalCode"
          bind:value={recipientPostalCode}
          placeholder="Recipient Postal Code"
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

<!-- UPDATE TRACKING MODAL BEGINS -->
<div class={`modal ${showTrackingFields ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (showTrackingFields = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Update Tracking</h1>
    <form on:submit={updateTrackingInformationAndSendNotification}>
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

      <!-- Submit Button -->
      <div class="mt-4 mt-5 flex justify-center">
        <button class="btn btn-info" type="submit">Update Tracking and Send Notification</button>
      </div>
    </form>
  </div>
</div>
<!-- UPDATE TRACKING MODAL ENDS -->
