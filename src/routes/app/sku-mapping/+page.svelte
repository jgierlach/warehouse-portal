<script>
  import { onMount } from 'svelte'

  // Stores
  import { skuMapping, loadSkuMapping } from '$lib/stores/skuMapping'
  import { inventory, loadInventory } from '$lib/stores/inventory'

  // Props
  // let { data } = $props()
  export let data

  // Execute onMount
  onMount(async () => {
    await loadSkuMapping(data.supabase)
    await loadInventory(data.supabase)
  })

  // Business Logic
  let showCreateSkuMapping = false

  let selectedProduct = null

  let id = 0
  $: productImageUrl = selectedProduct?.Product_Image_Url
  let sku = ''
  $: name = selectedProduct?.Name
  $: productId = selectedProduct?.id
  $: clientId = selectedProduct?.Client_Id
  let quantityToDeduct = 0

  function resetFields() {
    selectedProduct = null
    sku = ''
  }

  async function createSkuMapping(event) {
    event.preventDefault()
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
        quantity_to_deduct: quantityToDeduct,
      }),
    })
    if (response.ok) {
      await loadSkuMapping(data.supabase)
      showCreateSkuMapping = false
      resetFields()
    } else {
      const error = response.json()
      console.error('Failed to create sku mapping', error)
    }
  }

  let showDeleteSkuMapping = false
  let skuMapToDelete = {}
  async function deleteSkuMapping() {
    const response = await fetch('/app/api/sku-mapping/delete-sku-mapping', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: skuMapToDelete?.id,
      }),
    })
    if (response.ok) {
      await loadSkuMapping(data.supabase)
    } else {
      console.log('THERE IS AN ERROR')
      const error = response.json()
      console.error('Failed to delete sku mapping', error)
    }
    showDeleteSkuMapping = false
  }
</script>

{#if showCreateSkuMapping}
  <div class="mt-10 flex justify-center">
    <div class="ml-10 mr-10 max-w-4xl rounded-lg bg-base-100 p-4 shadow-xl">
      <h1 class="text-center text-3xl font-bold">Create Sku Mapping</h1>
      <form on:submit={createSkuMapping} class="mt-4 p-4 shadow-md">
        <div class="mt-4">
          <label for="productImageUrl" class="block">Product Image Url</label>
          <input
            type="text"
            id="productImageUrl"
            class="input input-bordered w-full bg-base-200"
            value={productImageUrl}
            required
          />
        </div>
        <div class="mt-4">
          <label for="sku" class="block">Sku Map</label>
          <input
            type="text"
            id="sku"
            class="input input-bordered w-full bg-base-200"
            bind:value={sku}
            required
          />
        </div>
        <div class="mt-4">
          <label for="quantityToDeduct" class="block">Quatity To Deduct</label>
          <input
            type="number"
            id="quantityToDeduct"
            class="input input-bordered w-full bg-base-200"
            bind:value={quantityToDeduct}
            required
          />
        </div>
        <div class="mt-4">
          <label for="name" class="block">Name</label>
          <input
            type="text"
            id="name"
            class="input input-bordered w-full bg-base-200"
            value={name}
            required
          />
        </div>
        <div class="mt-4">
          <label for="name" class="block">Client Id</label>
          <input
            type="text"
            id="clientId"
            class="input input-bordered w-full bg-base-200"
            value={clientId}
            required
          />
        </div>
        <div class="mt-4">
          <label for="productId" class="block">Product Id</label>
          <input
            type="number"
            id="productId"
            class="input input-bordered w-full bg-base-200"
            value={productId}
            required
          />
        </div>
        <div class="mt-4 flex justify-center">
          <button class="btn btn-error" on:click={() => (showCreateSkuMapping = false)}
            >Cancel</button
          >
          <button type="submit" class="btn btn-primary ml-4">Create</button>
        </div>
      </form>
    </div>
  </div>

  <!-- SELECTED PRODUCT BEGINS -->
  {#if selectedProduct !== null}
    <div class="mt-10 flex justify-center">
      <div class="ml-10 mr-10 max-w-5xl rounded-lg bg-base-100 p-4 shadow-xl">
        <h1 class="text-center text-3xl font-bold">Selected Product</h1>
        <div class="flex justify-center">
          <button on:click={() => (selectedProduct = null)} class="btn btn-outline btn-sm mt-4"
            >Reset</button
          >
        </div>
        <div class="mt-4 flex justify-center">
          <table class="table shadow-lg">
            <thead>
              <tr>
                <th>Product Image</th>
                <th>Sku</th>
                <th>Name</th>
                <th>Product Id</th>
                <th>Client Id</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <img
                    src={selectedProduct?.Product_Image_Url}
                    alt="selectedProduct thumbnail"
                    class="h-20 w-20"
                  />
                </td>
                <td>{selectedProduct?.Sku}</td>
                <td>{selectedProduct?.Name}</td>
                <td>{selectedProduct?.id}</td>
                <td>{selectedProduct?.Client_Id}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}
  <!-- SELECTED PRODUCT ENDS -->

  <!-- Select from existing products to map too begins -->
  <div class="mt-10 flex justify-center">
    <div class="ml-10 mr-10 max-w-5xl rounded-lg bg-base-100 p-4 shadow-xl">
      <h1 class="text-center text-3xl font-bold">Products To Map Too</h1>
      <div class="mt-4 flex justify-center">
        <table class="table shadow-lg">
          <thead>
            <tr>
              <th>Product Image</th>
              <th>Sku</th>
              <th>Name</th>
              <th>Product Id</th>
              <th>Client Id</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each $inventory as product}
              <tr>
                <td>
                  <img src={product?.Product_Image_Url} alt="product thumbnail" class="h-20 w-20" />
                </td>
                <td>{product?.Sku}</td>
                <td>{product?.Name}</td>
                <td>{product?.id}</td>
                <td>{product?.Client_Id}</td>
                <td
                  ><button on:click={() => (selectedProduct = product)} class="btn btn-outline"
                    >Select</button
                  ></td
                >
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <!-- Select from existing products to map too ends -->
{/if}

{#if !showCreateSkuMapping}
  <div class="mt-10 flex justify-center">
    <div class="ml-10 mr-10 max-w-4xl rounded-lg bg-base-100 p-4 shadow-xl">
      <h1 class="text-center text-3xl font-bold">Sku Mapping</h1>
      <div class="flex justify-center">
        <button
          class="btn btn-outline btn-primary btn-sm mt-4"
          on:click={() => (showCreateSkuMapping = true)}
          >Create Sku Mapping <i class="fas fa-plus"></i></button
        >
      </div>
      <div class="mt-4 flex justify-center">
        <table class="table max-w-10 shadow-lg">
          <thead>
            <tr>
              <th>Product Image</th>
              <th>Sku</th>
              <th>Quantity To Deduct</th>
              <th>Name</th>
              <th>Product Id</th>
              <th>Client Id</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each $skuMapping as sku}
              <tr>
                <td>
                  <img src={sku?.product_image_url} alt="product thumbnail" class="h-20 w-20" />
                </td>
                <td>{sku?.sku}</td>
                <td>{sku?.quantity_to_deduct}</td>
                <td>{sku?.name}</td>
                <td>{sku?.product_id}</td>
                <td>{sku?.client_id}</td>
                <td
                  ><div class="flex space-x-2">
                    <!-- <button class="btn btn-info btn-sm">Edit</button> -->
                    <button
                      on:click={() => {
                        skuMapToDelete = sku
                        showDeleteSkuMapping = true
                      }}
                      class="btn btn-error btn-sm">Delete</button
                    >
                  </div></td
                >
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
{/if}

<!-- DELETE SKU MAPPING MODAL BEGINS -->
<div class={`modal ${showDeleteSkuMapping ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (showDeleteSkuMapping = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mt-2 text-center text-lg font-bold">
      Are you sure you want to delete this sku map?
    </h1>
    <p class="entry-content py-4 text-center" style="white-space: pre-line;">
      {skuMapToDelete?.name}
    </p>
    <div class="flex justify-center">
      <img src={skuMapToDelete?.product_image_url} alt="product thumbnail" class="h-20 w-20" />
    </div>
    <div class="mt-4 flex justify-center">
      <button on:click={deleteSkuMapping} class="btn btn-error"> Yes, Delete </button>
    </div>
  </div>
</div>
<!-- DELETE SKU MAPPING MODAL ENDS -->
