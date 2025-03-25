<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'

  // Import components
  import Loading from '$lib/components/Loading.svelte'

  // Import utility functions
  import { abbreviateString, formatDate, generateUniqueShippingNumber } from '$lib/utils'

  // Import props
  export let data

  // Import stores
  import {
    outboundShipments,
    loadOutboundShipments,
    currentPage,
    pageSize,
    totalOutboundShipmentCount,
    searchQuery,
  } from '$lib/stores/outboundShipments.js'
  import { clients, loadClients } from '$lib/stores/clients.js'

  // Execute onMount
  onMount(async () => {
    console.log('Component mounting, initializing data...')
    // Set loading state to true
    loading = true

    // Make sure we have clean initial state
    currentPage.set(1)

    // Wait for both data loading functions to complete
    await Promise.all([loadOutboundShipments(data.supabase), loadClients(data.supabase)])

    // Explicitly set some derived values
    getTotalPages()
    generatePageNumbers()

    console.log('Component initialization complete')
    loading = false
  })

  // Component specific variables and business logic

  let loading = false

  let showDeleteOutboundShipment = false
  /** @type {any} */
  let outboundShipmentToDelete = {}

  /**
   * @param {any} id
   * @param {any} createdAt
   */
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
      showDeleteOutboundShipment = false
    } else {
      const errorData = await response.json()
      alert(`Failed to delete outboundshipments: ${errorData.message}`)
    }
    showDeleteOutboundShipment = false
    outboundShipmentToDelete = {}
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
  let costOfShipment = 0.0
  let buyerName = ''
  let buyerEmail = ''
  let recipientName = ''
  let recipientCompany = ''
  let recipientAddressLine1 = ''
  let recipientCity = ''
  let recipientState = ''
  let recipientPostalCode = ''
  let country = 'US'
  let lotNumber = ''
  let createInShipstation = false

  let showCreateOutboundShipment = false
  async function createOutboundShipment() {
    loading = true
    const response = await fetch('/app/api/outboundshipments/createShipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        shipmentNumber,
        carrier,
        trackingNumber,
        poNumber,
        destination,
        requiresAmazonLabeling,
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
        country,
        lotNumber,
      }),
    })
    if (response.ok) {
      loadOutboundShipments(data.supabase)
      clientId = ''
      shipmentNumber = ''
      carrier = ''
      trackingNumber = ''
      poNumber = ''
      destination = ''
      requiresAmazonLabeling = ''
      asin = ''
      productTitle = ''
      sku = ''
      status = ''
      dateOfLastChange = ''
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
      country = 'US'
      lotNumber = ''
    } else {
      const errorData = await response.json()
      alert(`Failed to create outbound shipment: ${errorData.message}`)
    }
    loading = false
    showCreateOutboundShipment = false
  }

  const destinations = [
    'Website Customer Order',
    'B2B Order',
    'Amazon FBA',
    'Amazon FBM Order',
    'Walmart Fulfillment Services',
    'Chewy.com',
    'Walmart Customer Order',
  ]

  let showEditOutboundShipment = false
  /** @type {any} */
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
        status,
        dateOfLastChange,
        asin,
        productTitle,
        sku,
        productImageUrl,
        quantity,
        costOfShipment,
        buyerName,
        buyerEmail,
        recipientName,
        recipientCompany,
        recipientAddressLine1,
        recipientCity,
        recipientState,
        recipientPostalCode,
        country,
        lotNumber,
      }),
    })
    if (response.ok) {
      loadOutboundShipments(data.supabase)
      goto(`/app/outboundshipments/#${outboundShipmentToEdit.id}`)
      showEditOutboundShipment = false
      outboundShipmentToEdit = {}
      clientId = ''
      shipmentNumber = ''
      carrier = ''
      trackingNumber = ''
      poNumber = ''
      destination = ''
      requiresAmazonLabeling = ''
      status = ''
      dateOfLastChange = ''
      asin = ''
      productTitle = ''
      sku = ''
      productImageUrl = ''
      quantity = 0
      costOfShipment = 0
      buyerName = ''
      buyerEmail = ''
      recipientName = ''
      recipientCompany = ''
      recipientAddressLine1 = ''
      recipientCity = ''
      recipientState = ''
      recipientPostalCode = ''
      country = ''
      lotNumber = ''
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
    const response = await fetch('/app/api/outboundshipments/updateTracking', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        shipmentNumber,
        carrier,
        trackingNumber,
      }),
    })
    if (response.ok) {
      loadOutboundShipments(data.supabase)
      clientId = ''
      shipmentNumber = ''
      carrier = ''
      trackingNumber = ''
      poNumber = ''
      recipientName = ''
    } else {
      const errorData = await response.json()
      alert(`Failed to update tracking for shipment: ${errorData.message}`)
    }
    showTrackingFields = false
    loading = false
  }

  $: clientIds = $clients
    .filter(
      (client) =>
        client.username !== 'wesley@hometown-industries.com' &&
        client.username !== 'susan@hometown-industries.com',
    )
    .map((client) => client.username)

  // Remove client-side sorting since we're sorting by created_at at the database level
  $: filteredShipments = $outboundShipments

  /** @type {any} */
  let hoveredTitleId = null
  /** @type {any} */
  let timer
  let localSearchQuery = ''

  // Update search query and reload data when local search changes
  $: {
    if (localSearchQuery !== $searchQuery) {
      loading = true
      $searchQuery = localSearchQuery
      $currentPage = 1 // Reset to first page on search
      loadOutboundShipments(data.supabase).then(() => {
        loading = false
      })
    }
  }

  // Search button click handler
  async function handleSearch() {
    loading = true
    $searchQuery = localSearchQuery
    $currentPage = 1 // Reset to first page on search
    await loadOutboundShipments(data.supabase)
    loading = false
  }

  /**
   * @param {any} id
   */
  function handleMouseEnter(id) {
    timer = setTimeout(() => {
      hoveredTitleId = id
    }, 1000)
  }

  function handleMouseLeave() {
    clearTimeout(timer)
    hoveredTitleId = null
  }

  // Pagination controls
  const pageSizeOptions = [50, 100, 250, 500, 1000]

  /**
   * @param {number} page
   */
  async function goToPage(page) {
    console.log('Going to page:', page)
    console.log('Current page before change:', $currentPage)
    console.log('Total pages:', getTotalPages())
    console.log('Total count:', $totalOutboundShipmentCount)
    console.log('Page size:', $pageSize)

    // Ensure page is a valid number and within bounds
    const totalPages = getTotalPages()
    if (page < 1) page = 1
    if (page > totalPages) page = totalPages

    console.log('Adjusted page (if needed):', page)

    // Set loading state to true while we load data
    loading = true

    // Update the store
    currentPage.set(page)
    console.log('Current page after store update:', $currentPage)

    // Load the data for this page
    await loadOutboundShipments(data.supabase)
    console.log('Data loaded, current page now:', $currentPage)

    // Set loading state back to false
    loading = false
  }

  /**
   * @param {number} size
   */
  async function changePageSize(size) {
    console.log('Changing page size to:', size)
    loading = true
    pageSize.set(size) // Use store.set() instead of $ prefix
    currentPage.set(1) // Reset to first page on page size change
    await loadOutboundShipments(data.supabase)
    loading = false
  }

  /**
   * @param {Event} event
   */
  function handlePageSizeChange(event) {
    if (event.target && 'value' in event.target) {
      const value = Number(event.target.value)
      changePageSize(value)
    }
  }

  function getTotalPages() {
    const total = Math.ceil($totalOutboundShipmentCount / $pageSize)
    console.log('getTotalPages calculation:', {
      totalCount: $totalOutboundShipmentCount,
      pageSize: $pageSize,
      result: total,
    })
    return total
  }

  // Helper function to generate page numbers for pagination
  function generatePageNumbers() {
    const totalPages = getTotalPages()
    console.log('Generating page numbers for total pages:', totalPages)
    console.log('Current page:', $currentPage)
    const maxVisiblePages = 5
    const result = []

    if (totalPages <= maxVisiblePages) {
      // If we have fewer pages than the max we want to show, display all of them
      for (let i = 1; i <= totalPages; i++) {
        result.push(i)
      }
    } else {
      // More complex logic for when we have lots of pages
      const currentPageValue = $currentPage

      // Always show first page
      result.push(1)

      // Calculate start and end of the visible page window
      let startPage = Math.max(2, currentPageValue - 1)
      let endPage = Math.min(totalPages - 1, startPage + 2)

      // Adjust if we're near the end
      if (endPage - startPage < 2) {
        startPage = Math.max(2, endPage - 2)
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        result.push('...')
      }

      // Add the middle pages
      for (let i = startPage; i <= endPage; i++) {
        result.push(i)
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        result.push('...')
      }

      // Always show last page
      if (totalPages > 1) {
        result.push(totalPages)
      }
    }

    console.log('Generated page numbers:', result)
    return result
  }

  /**
   * @param {string|number} pageNum
   */
  function handlePageClick(pageNum) {
    console.log('Handling page click:', pageNum)
    if (typeof pageNum === 'number') {
      goToPage(pageNum)
    }
  }
</script>

<Loading {loading} />
<div class="mt-4 flex justify-center px-2 sm:px-4 md:mt-10">
  <div class="w-full max-w-7xl rounded-lg bg-base-100 p-2 shadow-xl sm:p-4">
    <h1 class="mb-3 text-center text-2xl font-bold sm:mb-5 sm:text-3xl">Outbound Shipments</h1>

    <div class="mb-3 flex justify-center sm:mb-5">
      <button
        on:click={() => {
          showCreateOutboundShipment = !showCreateOutboundShipment
          // Clear the cache of all the field specific variables
          clientId = ''
          shipmentNumber = generateUniqueShippingNumber()
          carrier = ''
          trackingNumber = ''
          poNumber = ''
          destination = ''
          requiresAmazonLabeling = ''
          asin = ''
          productTitle = ''
          sku = ''
          status = ''
          dateOfLastChange = ''
          costOfShipment = 0.0
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
          country = ''
          lotNumber = ''
        }}
        class="btn btn-primary btn-sm sm:btn-md">Create Outbound Shipment</button
      >
    </div>

    <!-- Search and pagination controls - responsive layout -->
    <div class="mb-4 flex flex-col items-center justify-center gap-2">
      <div class="flex w-full gap-2 sm:w-auto">
        <input
          type="text"
          class="input input-sm w-full bg-base-200 sm:input-md sm:w-64"
          placeholder="Search by Shipment Number"
          bind:value={localSearchQuery}
        />
        <button class="btn btn-primary btn-sm sm:btn-md" on:click={handleSearch}>Search</button>
      </div>

      <div class="mt-2 flex items-center gap-2">
        <span class="text-sm">Page Size:</span>
        <select
          class="select select-bordered select-sm"
          value={$pageSize}
          on:change={handlePageSizeChange}
        >
          {#each pageSizeOptions as option}
            <option value={option}>{option}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Table for medium screens and up -->
    <div class="hidden overflow-x-auto md:block">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Image</th>
            <th>Shipment #</th>
            <th>Carrier</th>
            <th>Tracking #</th>
            <th>PO #</th>
            <th>Destination</th>
            <th>Status</th>
            <th>Order Date</th>
            <th>Product</th>
            <th>Sku</th>
            <th>Qty</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredShipments as shipment}
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
              <td>{shipment.Carrier === null ? 'Pending' : shipment.Carrier}</td>
              <td>{shipment.Tracking_Number === null ? 'Pending' : shipment.Tracking_Number}</td>
              <td>{shipment.PO_Number}</td>
              <td>{shipment.Destination}</td>
              <!-- <td>{shipment.Status}</td> -->
              <td
                ><button
                  class:btn-accent={shipment.Status === 'Shipped'}
                  class:btn-warning={shipment.Status === 'Pending'}
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
                    <div
                      class="absolute left-0 top-full z-50 mt-2 rounded-lg bg-gray-200 p-2 text-gray-800 opacity-100 shadow-lg"
                      style="opacity: 1; background-color: rgba(229, 231, 235, 1);"
                    >
                      {shipment['Product_Title']}
                    </div>
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
                      costOfShipment = shipment.Cost_Of_Shipment
                      buyerName = shipment.Buyer_Name
                      buyerEmail = shipment.Buyer_Email
                      recipientName = shipment.Recipient_Name
                      recipientCompany = shipment.Recipient_Company
                      recipientAddressLine1 = shipment.Recipient_Address_Line_1
                      recipientCity = shipment.Recipient_City
                      recipientState = shipment.Recipient_State
                      recipientPostalCode = shipment.Recipient_Postal_Code
                      country = shipment.Recipient_Country
                      lotNumber = shipment.Lot_Number
                    }}
                    class="btn btn-info btn-xs mb-2">Edit</button
                  >
                  <button
                    on:click={() => {
                      showTrackingFields = true
                      // outboundShipmentToEdit = shipment
                      clientId = shipment.Client_Id
                      shipmentNumber = shipment.Shipment_Number
                      carrier = shipment.Carrier
                      trackingNumber = shipment.Tracking_Number
                      poNumber = shipment.PO_Number
                      recipientName = shipment.Recipient_Name
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

    <!-- Card layout for small screens -->
    <div class="grid grid-cols-1 gap-4 md:hidden">
      {#each filteredShipments as shipment}
        <div class="card bg-base-200 shadow-md" id={shipment.id}>
          <div class="card-body p-4">
            <div class="flex items-start gap-3">
              <img
                class="h-16 w-16 flex-shrink-0 rounded-md object-cover shadow-md"
                alt="Product Image"
                src={shipment.Product_Image_Url === null
                  ? '/placeholder-image.jpg'
                  : shipment.Product_Image_Url}
              />
              <div class="flex-1">
                <h3 class="text-md font-bold">Shipment #{shipment.Shipment_Number}</h3>
                <p class="mt-1 text-sm">
                  <span class="font-semibold">Status:</span>
                  <span
                    class="badge badge-sm ml-1"
                    class:badge-accent={shipment.Status === 'Shipped'}
                    class:badge-warning={shipment.Status === 'Pending'}
                  >
                    {shipment.Status}
                  </span>
                </p>
                <p class="text-sm">
                  <span class="font-semibold">Date:</span>
                  {formatDate(shipment.Date_Of_Last_Change)}
                </p>
              </div>
            </div>

            <div class="divider my-1"></div>

            <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
              <div>
                <span class="font-semibold">Carrier:</span>
                {shipment.Carrier === null ? 'Pending' : shipment.Carrier}
              </div>
              <div>
                <span class="font-semibold">Tracking:</span>
                {shipment.Tracking_Number === null
                  ? 'Pending'
                  : abbreviateString(shipment.Tracking_Number, 10)}
              </div>
              <div>
                <span class="font-semibold">Destination:</span>
                {abbreviateString(shipment.Destination, 15)}
              </div>
              <div><span class="font-semibold">PO #:</span> {shipment.PO_Number || 'N/A'}</div>
              <div>
                <span class="font-semibold">Sku:</span>
                {abbreviateString(shipment.Sku, 12)}
              </div>
              <div><span class="font-semibold">Qty:</span> {shipment.Quantity}</div>
            </div>

            <div class="mt-1">
              <p class="text-sm font-semibold">Product:</p>
              <p class="text-sm">{abbreviateString(shipment.Product_Title, 50)}</p>
            </div>

            <div class="mt-3 flex flex-wrap justify-end gap-2">
              <button
                on:click={() => {
                  showEditOutboundShipment = true
                  outboundShipmentToEdit = shipment
                  // ... set all the fields as in original
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
                  costOfShipment = shipment.Cost_Of_Shipment
                  buyerName = shipment.Buyer_Name
                  buyerEmail = shipment.Buyer_Email
                  recipientName = shipment.Recipient_Name
                  recipientCompany = shipment.Recipient_Company
                  recipientAddressLine1 = shipment.Recipient_Address_Line_1
                  recipientCity = shipment.Recipient_City
                  recipientState = shipment.Recipient_State
                  recipientPostalCode = shipment.Recipient_Postal_Code
                  country = shipment.Recipient_Country
                  lotNumber = shipment.Lot_Number
                }}
                class="btn btn-info btn-xs">Edit</button
              >
              <button
                on:click={() => {
                  showTrackingFields = true
                  clientId = shipment.Client_Id
                  shipmentNumber = shipment.Shipment_Number
                  carrier = shipment.Carrier
                  trackingNumber = shipment.Tracking_Number
                  poNumber = shipment.PO_Number
                  recipientName = shipment.Recipient_Name
                }}
                class="btn btn-primary btn-xs">Update Tracking</button
              >
              <button
                on:click={() => {
                  showDeleteOutboundShipment = true
                  outboundShipmentToDelete = shipment
                }}
                class="btn btn-error btn-xs">Delete</button
              >
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination controls - responsive layout -->
    <div class="mt-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
      <div class="text-center text-sm sm:text-left">
        <span
          >Showing {($currentPage - 1) * $pageSize + 1} to {Math.min(
            $currentPage * $pageSize,
            $totalOutboundShipmentCount,
          )} of {$totalOutboundShipmentCount} items</span
        >
      </div>
      {#if $totalOutboundShipmentCount > 0}
        <div class="join">
          <button
            class="btn join-item btn-xs sm:btn-sm"
            disabled={$currentPage === 1}
            on:click={() => goToPage($currentPage - 1)}
          >
            «
          </button>
          {#each generatePageNumbers() as pageNum}
            {#if pageNum === '...'}
              <span class="btn btn-disabled join-item btn-xs sm:btn-sm">...</span>
            {:else}
              <button
                class="btn join-item btn-xs sm:btn-sm {pageNum === $currentPage
                  ? 'btn-active'
                  : ''}"
                on:click={() => handlePageClick(pageNum)}
              >
                {pageNum}
              </button>
            {/if}
          {/each}
          <button
            class="btn join-item btn-xs sm:btn-sm"
            disabled={$currentPage === getTotalPages() || getTotalPages() === 0}
            on:click={() => goToPage($currentPage + 1)}
          >
            »
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- DELETE SHIPMENT MODAL BEGINS -->
<div class={`modal ${showDeleteOutboundShipment ? 'modal-open' : ''}`}>
  <div class="modal-box relative mx-auto w-11/12 max-w-xl">
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
  <div class="modal-box relative mx-auto w-11/12 max-w-xl">
    <button
      on:click={() => (showEditOutboundShipment = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Edit Outbound Shipment</h1>
    <form on:submit={editOutboundShipment} class="max-h-[70vh] overflow-y-auto">
      <!-- Client ID Dropdown -->
      <div class="form-control mb-4">
        <label class="label" for="clientId">Client Id</label>
        <select
          required
          class="select select-bordered bg-base-200"
          id="clientId"
          bind:value={clientId}
        >
          <option value="" disabled>Select Client Id</option>
          {#each clientIds as clientIdOption}
            <option value={clientIdOption}>{clientIdOption}</option>
          {/each}
        </select>
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
      <!-- <div class="form-control mb-4">
        <label class="label" for="shipmentType">Shipment Type</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="shipmentType"
          bind:value={shipmentType}
          placeholder="Shipment Type"
        />
      </div> -->

      <!-- Status -->
      <div class="form-control mb-4">
        <label class="label" for="status">Status</label>
        <select class="select select-bordered bg-base-200" id="status" bind:value={status}>
          <!-- <option value="" disabled>Yes or No?</option> -->
          <option value={'Pending'}>Pending</option>
          <option value={'Shipped'}>Shipped</option>
        </select>
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

      <!-- Cost of Shipment -->
      <div class="form-control mb-4">
        <label class="label" for="costOfShipment">Cost Of Shipment</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="costOfShipment"
          bind:value={costOfShipment}
          step="0.01"
          placeholder="$4.55"
          inputmode="decimal"
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

      <!-- Recipient Country -->
      <div class="form-control mb-4">
        <label class="label" for="country">Recipient Country</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="country"
          bind:value={country}
          placeholder="Recipient Country"
        />
      </div>

      <!-- Lot Number -->
      <div class="form-control mb-4">
        <label class="label" for="lotNumber">Lot Number</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="lotNumber"
          bind:value={lotNumber}
          placeholder="Lot Number"
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

<!-- CREATE SHIPMENT MODAL BEGINS -->
<div class={`modal ${showCreateOutboundShipment ? 'modal-open' : ''}`}>
  <div class="modal-box relative mx-auto w-11/12 max-w-xl">
    <button
      on:click={() => (showCreateOutboundShipment = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Create Outbound Shipment</h1>
    <form on:submit={createOutboundShipment} class="max-h-[70vh] overflow-y-auto">
      <!-- Create in Shipstation Toggle -->
      <div class="form-control mb-4">
        <label class="label cursor-pointer">
          <span class="label-text">Create in Shipstation</span>
          <input type="checkbox" class="toggle toggle-primary" bind:checked={createInShipstation} />
        </label>
      </div>
      <!-- Client ID Dropdown -->
      <div class="form-control mb-4">
        <label class="label" for="clientId">Client Id</label>
        <select
          required
          class="select select-bordered bg-base-200"
          id="clientId"
          bind:value={clientId}
        >
          <option value="" disabled>Select Client Id</option>
          {#each clientIds as clientIdOption}
            <option value={clientIdOption}>{clientIdOption}</option>
          {/each}
        </select>
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
          <option value="" disabled>Select Destination</option>
          {#each destinations as destinationOption}
            <option value={destinationOption}>{destinationOption}</option>
          {/each}
        </select>
      </div>

      <!-- Requires Amazon Labeling -->
      <div class="form-control mb-4">
        <label class="label" for="requiresAmazonLabeling">Requires Amazon Labeling</label>
        <select
          class="select select-bordered bg-base-200"
          id="requiresAmazonLabeling"
          bind:value={requiresAmazonLabeling}
        >
          <!-- <option value="" disabled>Yes or No?</option> -->
          <option value={'No'}>No</option>
          <option value={'Yes'}>Yes</option>
        </select>
      </div>

      <!-- Status -->
      <div class="form-control mb-4">
        <label class="label" for="status">Status</label>
        <select class="select select-bordered bg-base-200" id="status" bind:value={status}>
          <!-- <option value="" disabled>Yes or No?</option> -->
          <option value={'Pending'}>Pending</option>
          <option value={'Shipped'}>Shipped</option>
        </select>
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

      <!-- Cost of Shipment -->
      <div class="form-control mb-4">
        <label class="label" for="costOfShipment">Cost Of Shipment</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="costOfShipment"
          bind:value={costOfShipment}
          step="0.01"
          min="0"
          placeholder="$4.55"
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

      <!-- Recipient Country -->
      <div class="form-control mb-4">
        <label class="label" for="country">Recipient Country</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="country"
          bind:value={country}
          placeholder="Recipient Country"
        />
      </div>

      <!-- Lot Number -->
      <div class="form-control mb-4">
        <label class="label" for="lotNumber">Lot Number</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="lotNumber"
          bind:value={lotNumber}
          placeholder="Lot Number"
        />
      </div>

      <!-- Submit Button -->
      <div class="mt-4 flex justify-center">
        <button class="btn btn-info" type="submit">Create Outbound Shipment</button>
      </div>
    </form>
  </div>
</div>
<!-- CREATE SHIPMENT MODAL ENDS -->

<!-- UPDATE TRACKING MODAL BEGINS -->
<div class={`modal ${showTrackingFields ? 'modal-open' : ''}`}>
  <div class="modal-box relative mx-auto w-11/12 max-w-xl">
    <button
      on:click={() => (showTrackingFields = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 mt-5 text-center text-xl font-semibold">
      Update Tracking - {shipmentNumber}
    </h1>
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
