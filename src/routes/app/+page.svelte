<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'

  // Import components
  import Loading from '$lib/components/Loading.svelte'

  // Import utility functions
  import { abbreviateString } from '$lib/utils'

  // Import props
  export let data

  // Import stores
  import { inventory, loadInventory } from '$lib/stores/inventory.js'
  import { clients, loadClients } from '$lib/stores/clients.js'

  // Execute onMount
  onMount(() => {
    loadInventory(data.supabase)
    loadClients(data.supabase)
  })

  // Component specific variables and business logic
  $: activeClients = $clients.filter(
    (client) =>
      client.username !== 'jan@hometown-industries.com' &&
      client.username !== 'wesley@hometown-industries.com' &&
      client.username !== 'susan@hometown-industries.com',
  )

  $: clientIds = activeClients.map((client) => client.username)

  let loading = false

  let showDeleteInventory = false
  let inventoryToDelete = {}

  async function deleteInventory(id, createdAt) {
    loading = true
    const response = await fetch('/app/api/inventory/deleteInventory', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        createdAt,
      }),
    })
    if (response.ok) {
      loadInventory(data.supabase)
      inventoryToDelete = {}
    } else {
      const errorData = await response.json()
      alert(`Failed to delete inventory: ${errorData.message}`)
    }
    inventoryToDelete = {}
    showDeleteInventory = false
    loading = false
  }

  // Inventory fields
  let clientId = ''
  let name = ''
  let asin = ''
  let productTitle = ''
  let sku = ''
  let productImageUrl = ''
  let pending = 0
  let quantity = 0
  let expirationDate = ''

  let showEditInventory = false
  let inventoryToEdit = {}

  async function editInventory() {
    loading = true
    const id = inventoryToEdit.id
    const createdAt = inventoryToEdit.created_at
    const response = await fetch('/app/api/inventory/editInventory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        createdAt,
        clientId,
        name,
        asin,
        productTitle,
        sku,
        productImageUrl,
        pending,
        quantity,
        expirationDate,
      }),
    })
    if (response.ok) {
      loadInventory(data.supabase)
      showEditInventory = false
      goto(`/app/#${inventoryToEdit.id}`)
      inventoryToEdit = {}
      clientId = ''
      name = ''
      asin = ''
      productTitle = ''
      sku = ''
      productImageUrl = ''
      pending = 0
      quantity = 0
      expirationDate = ''
    } else {
      const errorData = await response.json()
      alert(`Failed to edit inventory: ${errorData.message}`)
    }
    loading = false
  }

  let showCreateInventory = false

  async function createInventory() {
    loading = true
    const response = await fetch('/app/api/inventory/createInventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        name,
        asin,
        productTitle,
        sku,
        productImageUrl,
        pending,
        quantity,
        expirationDate,
      }),
    })
    if (response.ok) {
      loadInventory(data.supabase)
      showCreateInventory = false
      clientId = ''
      name = ''
      asin = ''
      productTitle = ''
      sku = ''
      productImageUrl = ''
      pending = 0
      quantity = 0
      expirationDate = ''
    } else {
      const errorData = await response.json()
      alert(`Failed to Create inventory: ${errorData.message}`)
    }
    loading = false
  }

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
    <h1 class="mb-2 text-center text-3xl font-bold">Client Inventory</h1>
    <div class="mb-4 flex justify-center">
      <button
        on:click={() => (showCreateInventory = true)}
        class="btn btn-outline btn-primary btn-sm"
        >Add Product <i class="fas fa-plus"></i>
      </button>
    </div>
    <table class="table table-zebra">
      <thead>
        <tr>
          <th>Product Image</th>
          <!-- <th>Client Id</th> -->
          <th>Asin</th>
          <th>Product Url</th>
          <th>Product Title</th>
          <th>Sku</th>
          <th>Product Quantity</th>
          <th>Pending</th>
          <th>Expiration Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each $inventory as product}
          <tr id={product.id}>
            <td
              ><img
                class="h-12 w-12 rounded-md object-cover shadow-md"
                alt="Product Image"
                src={product.Product_Image_Url === null
                  ? '/placeholder-image.jpg'
                  : product.Product_Image_Url}
              /></td
            >
            <!-- <td>{product.Client_Id}</td> -->
            <td>{product.Asin}</td>
            <td
              ><a
                href={`https://www.amazon.com/dp/${product.Asin}`}
                target="_blank"
                class="font-bold text-info">Product Url</a
              ></td
            >
            <td
              ><div
                class="tooltip"
                role="tooltip"
                on:mouseenter={() => handleMouseEnter(product['Product_Title'])}
                on:mouseleave={handleMouseLeave}
              >
                {abbreviateString(product['Product_Title'], 25)}
                {#if hoveredTitleId === product['Product_Title']}
                  <span class="tooltip-text">
                    {product['Product_Title']}...
                  </span>
                {/if}
              </div></td
            >
            <td>{product.Sku}</td>
            <td>{product.Quantity}</td>
            <td>{product.Pending}</td>
            <td>{product.Product_Expiration}</td>
            <td>
              <div class="flex items-center justify-center">
                <button
                  on:click={() => {
                    showEditInventory = true
                    inventoryToEdit = product
                    clientId = product.Client_Id
                    name = product.Name
                    asin = product.Asin
                    productTitle = product.Product_Title
                    sku = product.Sku
                    productImageUrl = product.Product_Image_Url
                    pending = product.Pending
                    quantity = product.Quantity
                    expirationDate = product.Product_Expiration
                  }}
                  class="btn btn-info btn-sm mr-2">Edit</button
                >
                <button
                  on:click={() => {
                    showDeleteInventory = true
                    inventoryToDelete = product
                  }}
                  class="btn btn-error btn-sm">Delete</button
                >
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<!-- DELETE INVENTORY MODAL BEGINS -->
<div class={`modal ${showDeleteInventory ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (showDeleteInventory = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mt-2 text-center text-lg font-bold">
      Are you sure you want to delete this inventory?
    </h1>
    <p class="entry-content py-4 text-center" style="white-space: pre-line;">
      {inventoryToDelete.Product_Title}
    </p>
    <div class="flex justify-center">
      <button
        on:click={() => deleteInventory(inventoryToDelete.id, inventoryToDelete.created_at)}
        class="btn btn-error"
      >
        Yes, Delete
      </button>
    </div>
  </div>
</div>
<!-- DELETE INVENTORY MODAL ENDS -->

<!-- EDIT INVENTORY MODAL BEGINS -->
<div class={`modal ${showEditInventory ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (showEditInventory = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Edit Inventory</h1>
    <form on:submit={editInventory}>
      <!-- Client ID -->
      <div class="form-control mb-4">
        <label class="label" for="clientId">Client Id</label>
        <input
          required
          class="input input-bordered bg-base-200"
          type="text"
          id="clientId"
          bind:value={clientId}
          placeholder="Client Id"
        />
      </div>

      <!-- Name -->
      <div class="form-control mb-4">
        <label class="label" for="name">Name</label>
        <input
          required
          class="input input-bordered bg-base-200"
          id="name"
          bind:value={name}
          placeholder="Product Name"
        />
      </div>

      <!-- ASIN -->
      <div class="form-control mb-4">
        <label class="label" for="asin">ASIN</label>
        <input
          required
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
          required
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
          required
          class="input input-bordered bg-base-200"
          type="text"
          id="sku"
          bind:value={sku}
          placeholder="SKU"
        />
      </div>

      <!-- Expiration Date -->
      <div class="form-control mb-4">
        <label class="label" for="sku">Expiration Date</label>
        <input
          required
          class="input input-bordered bg-base-200"
          type="text"
          id="sku"
          bind:value={expirationDate}
          placeholder="MM/DD/YYYY"
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
          required
          class="input input-bordered bg-base-200"
          type="number"
          id="quantity"
          bind:value={quantity}
          placeholder="Total Quantity"
        />
      </div>

      <!-- Pending Quantity -->
      <div class="form-control mb-4">
        <label class="label" for="pending">Pending Quantity</label>
        <input
          required
          class="input input-bordered bg-base-200"
          type="number"
          id="pending"
          bind:value={pending}
          placeholder="Pending Quantity"
        />
      </div>

      <!-- Submit Button -->
      <div class="mt-4 flex justify-center">
        <button class="btn btn-info" type="submit">Save</button>
      </div>
    </form>
  </div>
</div>
<!-- EDIT INVENTORY MODAL ENDS -->

<!-- CREATE INVENTORY MODAL BEGINS -->
<div class={`modal ${showCreateInventory ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (showCreateInventory = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Create Inventory</h1>
    <form on:submit={createInventory}>
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

      <!-- Name -->
      <div class="form-control mb-4">
        <label class="label" for="name">Name</label>
        <input
          required
          class="input input-bordered bg-base-200"
          id="name"
          bind:value={name}
          placeholder="Product Name"
        />
      </div>

      <!-- ASIN -->
      <div class="form-control mb-4">
        <label class="label" for="asin">ASIN</label>
        <input
          required
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
          required
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
          required
          class="input input-bordered bg-base-200"
          type="text"
          id="sku"
          bind:value={sku}
          placeholder="SKU"
        />
      </div>

      <!-- Expiration Date -->
      <div class="form-control mb-4">
        <label class="label" for="sku">Expiration Date</label>
        <input
          required
          class="input input-bordered bg-base-200"
          type="text"
          id="sku"
          bind:value={expirationDate}
          placeholder="MM/DD/YYYY"
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

      <!-- Pending Quantity -->
      <div class="form-control mb-4">
        <label class="label" for="pending">Pending Quantity</label>
        <input
          required
          class="input input-bordered bg-base-200"
          type="number"
          id="pending"
          bind:value={pending}
          placeholder="Pending Quantity"
        />
      </div>

      <!-- Quantity -->
      <div class="form-control mb-4">
        <label class="label" for="quantity">Quantity</label>
        <input
          required
          class="input input-bordered bg-base-200"
          type="number"
          id="quantity"
          bind:value={quantity}
          placeholder="Total Quantity"
        />
      </div>

      <!-- Submit Button -->
      <div class="mt-4 flex justify-center">
        <button class="btn btn-info" type="submit">Submit</button>
      </div>
    </form>
  </div>
</div>
<!-- Create INVENTORY MODAL ENDS -->
