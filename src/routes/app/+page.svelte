<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'

  // Import components
  import Navbar from '$lib/components/Navbar.svelte'

  // Import utility functions
  import { test, abbreviateString } from '$lib/utils'

  // Import props
  export let data

  // Import stores
  import { testStore, loadTestStore } from '$lib/stores/test'
  import { inventory, loadInventory } from '$lib/stores/inventory.js'

  // Execute onMount
  onMount(() => {
    loadTestStore()
    loadInventory(data.supabase)
  })

  // Component specific variables and business logic

  $: {
    console.log('INVENTORY', $inventory)
  }

  let showDeleteInventory = false
  let inventoryToDelete = {}

  async function deleteInventory(id, createdAt) {
    const response = await fetch('/app/api/deleteinventory', {
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

  let showEditInventory = false
  let inventoryToEdit = {}

  async function editInventory() {
    const id = inventoryToEdit.id
    const createdAt = inventoryToEdit.created_at
    const response = await fetch('/app/api/editInventory', {
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
      }),
    })
    if (response.ok) {
      loadInventory(data.supabase)
      showEditInventory = false
      inventoryToEdit = {}
      clientId = ''
      name = ''
      asin = ''
      productTitle = ''
      sku = ''
      productImageUrl = ''
      pending = 0
      quantity = 0
    } else {
      const errorData = await response.json()
      alert(`Failed to edit inventory: ${errorData.message}`)
    }
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

<div class="mt-6 flex justify-center">
  <div class="ml-10 mr-10 bg-base-100 p-4 shadow-xl">
    <h1 class="mb-2 text-center text-3xl font-bold">Client Inventory</h1>
    <div class="mb-4 flex justify-center">
      <button class="btn btn-outline btn-primary btn-sm"
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
          <tr>
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
            <td class="flex items-center justify-center"
              ><button
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
                }}
                class="btn btn-outline btn-info btn-sm mr-2">Edit</button
              >
              <button
                on:click={() => {
                  showDeleteInventory = true
                  inventoryToDelete = product
                }}
                class="btn btn-outline btn-error btn-sm">Delete</button
              ></td
            >
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
    <p class="entry-content py-4" style="white-space: pre-line;">
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
      <div class="form-control mb-4">
        <label class="label" for="habitName">Client Id</label>
        <input
          required
          class="input input-bordered"
          type="text"
          id="habitName"
          bind:value={clientId}
          placeholder="Client Id"
        />
      </div>

      <div class="form-control mb-4">
        <label class="label" for="name">Name</label>
        <textarea
          required
          class="textarea textarea-bordered placeholder:text-base"
          id="description"
          bind:value={name}
          placeholder="Product Name"
        ></textarea>
      </div>

      <div class="mt-4 flex justify-center">
        <button class="btn btn-info" type="submit">Save</button>
      </div>
    </form>
  </div>
</div>
<!-- EDIT INVENTORY MODAL ENDS -->
