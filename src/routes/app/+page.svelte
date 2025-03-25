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
  import { loadSkuMapping } from '$lib/stores/skuMapping.js'

  // Execute onMount
  onMount(async () => {
    loadInventory(data.supabase)
    loadClients(data.supabase)
  })

  // Component specific variables and business logic
  $: activeClients = $clients.filter(
    (client) =>
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
  let lotNumber = ''

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
        inventoryToEdit,
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
        lotNumber,
      }),
    })
    if (response.ok) {
      loadInventory(data.supabase)
      showEditInventory = false
      goto(`/app/#${inventoryToEdit.id}`)
      inventoryToEdit = {}
      resetFields()
    } else {
      const errorData = await response.json()
      alert(`Failed to edit inventory: ${errorData.message}`)
    }
    loading = false
  }

  function resetFields() {
    clientId = ''
    name = ''
    asin = ''
    productTitle = ''
    sku = ''
    productImageUrl = ''
    pending = 0
    quantity = 0
    expirationDate = ''
    lotNumber = ''
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
        lotNumber,
      }),
    })
    if (response.ok) {
      loadInventory(data.supabase)
      showCreateInventory = false
      return response.json()
    } else {
      const errorData = await response.json()
      alert(`Failed to Create inventory: ${errorData.message}`)
    }
    loading = false
  }

  async function createSkuMapping(productId, clientId, sku, name, productImageUrl) {
    const response = await fetch('/app/api/sku-mapping/create-sku-mapping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        client_id: clientId,
        sku,
        name,
        product_image_url: productImageUrl,
        quantity_to_deduct: 1,
      }),
    })
    if (response.ok) {
      await loadSkuMapping(data.supabase)
    } else {
      const error = response.json()
      console.error('Failed to create sku mapping', error)
    }
  }

  async function createProduct(event) {
    event.preventDefault()
    try {
      const product = await createInventory()
      const productId = product?.body?.id
      await createSkuMapping(productId, clientId, sku, name, productImageUrl)
      resetFields()
    } catch (err) {
      console.error('Failed to create product', err)
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
<div class="mt-4 flex justify-center px-2 sm:px-4 md:mt-10">
  <div class="w-full max-w-7xl rounded-lg bg-base-100 p-2 shadow-xl sm:p-4">
    <h1 class="mb-2 text-center text-2xl font-bold sm:text-3xl">Client Inventory</h1>
    <div class="mb-4 flex justify-center">
      <button
        on:click={() => {
          showCreateInventory = true
          clientId = ''
          name = ''
          asin = ''
          productTitle = ''
          sku = ''
          productImageUrl = ''
          pending = 0
          quantity = 0
          expirationDate = ''
          lotNumber = ''
        }}
        class="btn btn-outline btn-primary btn-sm"
        >Add Product <i class="fas fa-plus ml-1"></i>
      </button>
    </div>

    <!-- Table for medium screens and above -->
    <div class="hidden overflow-x-auto md:block">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Product Image</th>
            <th>Asin</th>
            <th>Product Url</th>
            <th>Product Title</th>
            <th>Sku</th>
            <th>Quantity</th>
            <th>Pending</th>
            <th>Expiration</th>
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
                    <div
                      class="absolute left-0 top-full z-50 mt-2 rounded-lg bg-gray-200 p-2 text-gray-800 opacity-100 shadow-lg"
                      style="opacity: 1; background-color: rgba(229, 231, 235, 1);"
                    >
                      {product['Product_Title']}
                    </div>
                  {/if}
                </div>
              </td>
              <td>{product.Sku}</td>
              <td>{product.Quantity}</td>
              <td>{product.Pending}</td>
              <td
                >{product?.Product_Expiration === null
                  ? 'No Expiration Date'
                  : product?.Product_Expiration}</td
              >
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
                      lotNumber = product.Lot_Number
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

    <!-- Card layout for small screens -->
    <div class="grid grid-cols-1 gap-4 md:hidden">
      {#each $inventory as product}
        <div class="card bg-base-200 shadow-md" id={product.id}>
          <div class="card-body p-4">
            <div class="flex items-center gap-4">
              <img
                class="h-16 w-16 rounded-md object-cover shadow-md"
                alt="Product Image"
                src={product.Product_Image_Url === null
                  ? '/placeholder-image.jpg'
                  : product.Product_Image_Url}
              />
              <div>
                <h3 class="text-md font-bold">
                  <div
                    class="tooltip"
                    role="tooltip"
                    on:mouseenter={() => handleMouseEnter(product['Product_Title'])}
                    on:mouseleave={handleMouseLeave}
                  >
                    {abbreviateString(product['Product_Title'], 25)}
                    {#if hoveredTitleId === product['Product_Title']}
                      <div
                        class="absolute left-0 top-full z-50 mt-2 rounded-lg bg-gray-200 p-2 text-gray-800 opacity-100 shadow-lg"
                        style="opacity: 1; background-color: rgba(229, 231, 235, 1);"
                      >
                        {product['Product_Title']}
                      </div>
                    {/if}
                  </div>
                </h3>
                <p class="text-sm">SKU: {product.Sku}</p>
              </div>
            </div>

            <div class="mt-3 grid grid-cols-2 gap-2">
              <div class="text-sm">ASIN: <span class="font-semibold">{product.Asin}</span></div>
              <div class="text-sm">
                Quantity: <span class="font-semibold">{product.Quantity}</span>
              </div>
              <div class="text-sm">
                Pending: <span class="font-semibold">{product.Pending}</span>
              </div>
              <div class="text-sm">
                Expiration: <span class="font-semibold"
                  >{product?.Product_Expiration === null
                    ? 'None'
                    : product?.Product_Expiration}</span
                >
              </div>
            </div>

            <div class="mt-3 flex items-center justify-between">
              <a
                href={`https://www.amazon.com/dp/${product.Asin}`}
                target="_blank"
                class="btn btn-ghost btn-xs text-info">Amazon Link</a
              >

              <div class="flex gap-2">
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
                    lotNumber = product.Lot_Number
                  }}
                  class="btn btn-info btn-xs">Edit</button
                >
                <button
                  on:click={() => {
                    showDeleteInventory = true
                    inventoryToDelete = product
                  }}
                  class="btn btn-error btn-xs">Delete</button
                >
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
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
      <img src={inventoryToDelete?.Product_Image_Url} alt="product thumbnail" class="h-20 w-20" />
    </div>
    <div class="mt-4 flex justify-center">
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
  <div class="modal-box relative mx-auto w-11/12 max-w-xl">
    <button
      on:click={() => (showEditInventory = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Edit Inventory</h1>
    <form on:submit={editInventory} class="max-h-[70vh] overflow-y-auto">
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

      <!-- Lot Numbers -->
      <div class="form-control mb-4">
        <label class="label" for="lotNumber">Lot Numbers</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="lotNumber"
          bind:value={lotNumber}
          placeholder="Lot Numbers"
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
  <div class="modal-box relative mx-auto w-11/12 max-w-xl">
    <button
      on:click={() => (showCreateInventory = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Create Inventory</h1>
    <form on:submit={createProduct} class="max-h-[70vh] overflow-y-auto">
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

      <!-- Lot Numbers -->
      <div class="form-control mb-4">
        <label class="label" for="lotNumber">Lot Numbers</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="lotNumber"
          bind:value={lotNumber}
          placeholder="Lot Numbers"
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
