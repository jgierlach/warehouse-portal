<script>
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'

  // Stores
  import { skuMapping, loadSkuMapping } from '$lib/stores/skuMapping'
  import { inventory, loadInventory } from '$lib/stores/inventory'
  import { unmappedSkus, loadUnmappedSkus } from '$lib/stores/unmappedSkus'
  import { loadCoupons } from '$lib/stores/coupons.js'

  // Props
  export let data

  // Utils
  import { abbreviateString } from '$lib/utils'

  // Execute onMount
  onMount(async () => {
    await loadSkuMapping(data.supabase)
    await loadInventory(data.supabase)
    await loadUnmappedSkus(data.supabase)
  })

  // Business Logic
  let showCreateSkuMapping = false

  let selectedProduct = null

  $: productImageUrl = selectedProduct?.Product_Image_Url
  let sku = ''
  $: name = selectedProduct?.Name
  $: productId = selectedProduct?.id
  $: clientId = selectedProduct?.Client_Id
  let quantityToDeduct = 1

  function resetFields() {
    selectedProduct = null
    sku = ''
    quantityToDeduct = 1
  }

  async function createSkuMapping(event) {
    event.preventDefault()

    // See if any skus in the unmapped skus array match the skus that's passed in. If it does delete that sku automatically
    const skuToDelete = $unmappedSkus.find((unmappedSku) => unmappedSku?.sku === sku)
    if (skuToDelete) {
      try {
        await deleteUnmappedSku(skuToDelete)
      } catch (error) {
        console.error('Error deleting SKU:', error)
      }
    } else {
      console.warn(`SKU ${sku} not found in unmappedSkus.`)
    }

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

  async function deleteUnmappedSku(sku) {
    // If no sku value is available then delete by id otherwise delete by sku
    if (sku?.sku === '' || sku?.sku === null) {
      const response = await fetch('/app/api/sku-mapping/delete-unmapped-sku-by-id', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: sku?.id,
        }),
      })
      if (response.ok) {
        await loadUnmappedSkus(data.supabase)
      } else {
        const error = response.json()
        console.error('Failed to delete sku mapping', error)
      }
    } else {
      const response = await fetch('/app/api/sku-mapping/delete-unmapped-sku', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sku: sku?.sku,
        }),
      })
      if (response.ok) {
        await loadUnmappedSkus(data.supabase)
      } else {
        const error = response.json()
        console.error('Failed to delete sku mapping', error)
      }
    }
  }

  async function addCoupon(clientId, name, sku, id) {
    const response = await fetch('/app/api/coupons/createCoupon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        name,
      }),
    })
    if (response.ok) {
      await loadCoupons(data.supabase)
      await deleteUnmappedSku({ sku, id })
    } else {
      const error = response.json()
      console.error('Failed to add coupon', error)
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

{#if $unmappedSkus?.length > 0}
  <div class="mt-4 flex justify-center px-2 sm:px-4 md:mt-10">
    <div class="w-full max-w-5xl rounded-lg bg-base-100 p-2 shadow-xl sm:p-4">
      <div class="flex items-center justify-center text-xl font-semibold sm:text-2xl">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 flex-shrink-0 stroke-current text-yellow-400 sm:h-6 sm:w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.29 3.86l-6.4 11A1 1 0 004 16h16a1 1 0 00.86-1.49l-6.4-11a1 1 0 00-1.72 0zM12 9v4m0 4h.01"
          ></path>
        </svg>
        <span class="ml-2">Warning! You have unmapped skus.</span>
      </div>

      <!-- Table for medium screens and up -->
      <div class="mt-4 hidden overflow-x-auto md:block">
        <table class="table w-full shadow-lg">
          <thead>
            <tr>
              <th>Product Image</th>
              <th>Shipment Number</th>
              <th>Sku</th>
              <th>Name</th>
              <th>Order Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each $unmappedSkus as sku}
              <tr>
                <td>
                  <img
                    src={sku?.product_image_url === null
                      ? '/placeholder-image.jpg'
                      : sku?.product_image_url}
                    alt="product thumbnail"
                    class="h-16 w-16 rounded-md object-cover sm:h-20 sm:w-20"
                  />
                </td>
                <td>{sku?.shipment_number}</td>
                <td>{sku?.sku}</td>
                <td>{sku?.name}</td>
                <td>{sku?.order_source}</td>
                <td>
                  <button
                    on:click={() => addCoupon(sku?.client_id, sku?.name, sku?.sku, sku?.id)}
                    class="btn btn-info btn-sm">Add As Coupon</button
                  >
                  <button on:click={() => deleteUnmappedSku(sku)} class="btn btn-error btn-sm"
                    >Delete</button
                  ></td
                >
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Card layout for small screens -->
      <div class="mt-4 grid grid-cols-1 gap-4 md:hidden">
        {#each $unmappedSkus as sku}
          <div class="card bg-base-200 shadow-md">
            <div class="card-body p-4">
              <div class="flex items-center gap-4">
                <img
                  src={sku?.product_image_url === null
                    ? '/placeholder-image.jpg'
                    : sku?.product_image_url}
                  alt="product thumbnail"
                  class="h-16 w-16 rounded-md object-cover"
                />
                <div>
                  <h3 class="text-md font-bold">{sku?.name || 'No name'}</h3>
                  <p class="text-sm">SKU: {sku?.sku}</p>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <div class="text-sm">
                  Shipment: <span class="font-semibold">{sku?.shipment_number}</span>
                </div>
                <div class="text-sm">
                  Source: <span class="font-semibold">{sku?.order_source}</span>
                </div>
              </div>

              <div class="mt-3 flex justify-end">
                <button on:click={() => deleteUnmappedSku(sku)} class="btn btn-error btn-sm"
                  >Delete</button
                >
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

{#if showCreateSkuMapping}
  <div class="mt-4 flex justify-center px-2 sm:px-4 md:mt-10">
    <div
      id="create-sku-mapping"
      class="w-full max-w-4xl rounded-lg bg-base-100 p-2 shadow-xl sm:p-4"
    >
      <h1 class="text-center text-2xl font-bold sm:text-3xl">Create Sku Mapping</h1>
      <form on:submit={createSkuMapping} class="mt-4 p-2 shadow-md sm:p-4">
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
            on:input={() => (sku = sku.trim())}
            required
          />
        </div>
        <div class="mt-4">
          <label for="quantityToDeduct" class="block">Quantity To Deduct</label>
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
    <div class="mt-4 flex justify-center px-2 sm:px-4 md:mt-10">
      <div class="w-full max-w-5xl rounded-lg bg-base-100 p-2 shadow-xl sm:p-4">
        <h1 class="text-center text-2xl font-bold sm:text-3xl">Selected Product</h1>
        <div class="flex justify-center">
          <button on:click={() => (selectedProduct = null)} class="btn btn-outline btn-sm mt-4"
            >Reset</button
          >
        </div>

        <!-- Table for medium screens and up -->
        <div class="mt-4 hidden overflow-x-auto md:block">
          <table class="table w-full shadow-lg">
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
                    class="h-16 w-16 rounded-md object-cover sm:h-20 sm:w-20"
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

        <!-- Card for small screens -->
        <div class="mt-4 md:hidden">
          <div class="card bg-base-200 shadow-md">
            <div class="card-body p-4">
              <div class="flex items-center gap-4">
                <img
                  src={selectedProduct?.Product_Image_Url}
                  alt="selectedProduct thumbnail"
                  class="h-16 w-16 rounded-md object-cover"
                />
                <div>
                  <h3 class="text-md font-bold">{selectedProduct?.Name}</h3>
                  <p class="text-sm">SKU: {selectedProduct?.Sku}</p>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <div class="text-sm">
                  Product ID: <span class="font-semibold">{selectedProduct?.id}</span>
                </div>
                <div class="text-sm">
                  Client ID: <span class="font-semibold">{selectedProduct?.Client_Id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
  <!-- SELECTED PRODUCT ENDS -->

  <!-- Select from existing products to map too begins -->
  <div class="mt-4 flex justify-center px-2 sm:px-4 md:mt-10">
    <div class="w-full max-w-5xl rounded-lg bg-base-100 p-2 shadow-xl sm:p-4">
      <h1 class="text-center text-2xl font-bold sm:text-3xl">Products To Map Too</h1>

      <!-- Table for medium screens and up -->
      <div class="mt-4 hidden overflow-x-auto md:block">
        <table class="table w-full shadow-lg">
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
                  <img
                    src={product?.Product_Image_Url}
                    alt="product thumbnail"
                    class="h-16 w-16 rounded-md object-cover sm:h-20 sm:w-20"
                  />
                </td>
                <td>{product?.Sku}</td>
                <td>{product?.Name}</td>
                <td>{product?.id}</td>
                <td>{product?.Client_Id}</td>
                <td
                  ><button
                    on:click={() => {
                      selectedProduct = product
                      goto('/app/sku-mapping/#create-sku-mapping')
                    }}
                    class="btn btn-outline btn-sm">Select</button
                  ></td
                >
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Card layout for small screens -->
      <div class="mt-4 grid grid-cols-1 gap-4 md:hidden">
        {#each $inventory as product}
          <div class="card bg-base-200 shadow-md">
            <div class="card-body p-4">
              <div class="flex items-center gap-4">
                <img
                  src={product?.Product_Image_Url}
                  alt="product thumbnail"
                  class="h-16 w-16 rounded-md object-cover"
                />
                <div>
                  <h3 class="text-md font-bold">{product?.Name}</h3>
                  <p class="text-sm">SKU: {product?.Sku}</p>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <div class="text-sm">
                  Product ID: <span class="font-semibold">{product?.id}</span>
                </div>
                <div class="text-sm">
                  Client ID: <span class="font-semibold">{product?.Client_Id}</span>
                </div>
              </div>

              <div class="mt-3 flex justify-end">
                <button
                  on:click={() => {
                    selectedProduct = product
                    goto('/app/sku-mapping/#create-sku-mapping')
                  }}
                  class="btn btn-outline btn-sm">Select</button
                >
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
  <!-- Select from existing products to map too ends -->
{/if}

{#if !showCreateSkuMapping}
  <div class="mt-4 flex justify-center px-2 sm:px-4 md:mt-10">
    <div class="w-full max-w-7xl rounded-lg bg-base-100 p-2 shadow-xl sm:p-4">
      <h1 class="text-center text-2xl font-bold sm:text-3xl">Sku Mapping</h1>
      <div class="flex justify-center">
        <button
          class="btn btn-outline btn-primary btn-sm mt-4"
          on:click={() => (showCreateSkuMapping = true)}
          >Create Sku Mapping <i class="fas fa-plus ml-1"></i></button
        >
      </div>

      <!-- Table for medium screens and up -->
      <div class="mt-4 hidden overflow-x-auto md:block">
        <table class="table w-full shadow-lg">
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
                  <img
                    src={sku?.product_image_url}
                    alt="product thumbnail"
                    class="h-16 w-16 rounded-md object-cover sm:h-20 sm:w-20"
                  />
                </td>
                <td>{sku?.sku}</td>
                <td>{sku?.quantity_to_deduct}</td>
                <td
                  ><div
                    class="tooltip"
                    role="tooltip"
                    on:mouseenter={() => handleMouseEnter(sku?.name)}
                    on:mouseleave={handleMouseLeave}
                  >
                    {abbreviateString(sku?.name, 25)}
                    {#if hoveredTitleId === sku?.name}
                      <div
                        class="absolute left-0 top-full z-50 mt-2 rounded-lg bg-gray-200 p-2 text-gray-800 opacity-100 shadow-lg"
                        style="opacity: 1; background-color: rgba(229, 231, 235, 1);"
                      >
                        {sku?.name}
                      </div>
                    {/if}
                  </div></td
                >
                <td>{sku?.product_id}</td>
                <td>{sku?.client_id}</td>
                <td
                  ><div class="flex space-x-2">
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

      <!-- Card layout for small screens -->
      <div class="mt-4 grid grid-cols-1 gap-4 md:hidden">
        {#each $skuMapping as sku}
          <div class="card bg-base-200 shadow-md">
            <div class="card-body p-4">
              <div class="flex items-center gap-4">
                <img
                  src={sku?.product_image_url}
                  alt="product thumbnail"
                  class="h-16 w-16 rounded-md object-cover"
                />
                <div>
                  <h3 class="text-md font-bold">
                    <div
                      class="tooltip"
                      role="tooltip"
                      on:mouseenter={() => handleMouseEnter(sku?.name)}
                      on:mouseleave={handleMouseLeave}
                    >
                      {abbreviateString(sku?.name, 25)}
                      {#if hoveredTitleId === sku?.name}
                        <div
                          class="absolute left-0 top-full z-50 mt-2 rounded-lg bg-gray-200 p-2 text-gray-800 opacity-100 shadow-lg"
                          style="opacity: 1; background-color: rgba(229, 231, 235, 1);"
                        >
                          {sku?.name}
                        </div>
                      {/if}
                    </div>
                  </h3>
                  <p class="text-sm">SKU: {sku?.sku}</p>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <div class="text-sm">
                  Quantity: <span class="font-semibold">{sku?.quantity_to_deduct}</span>
                </div>
                <div class="text-sm">
                  Product ID: <span class="font-semibold">{sku?.product_id}</span>
                </div>
                <div class="text-sm">
                  Client ID: <span class="font-semibold">{sku?.client_id}</span>
                </div>
              </div>

              <div class="mt-3 flex justify-end">
                <button
                  on:click={() => {
                    skuMapToDelete = sku
                    showDeleteSkuMapping = true
                  }}
                  class="btn btn-error btn-sm">Delete</button
                >
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<!-- DELETE SKU MAPPING MODAL BEGINS -->
<div class={`modal ${showDeleteSkuMapping ? 'modal-open' : ''}`}>
  <div class="modal-box relative mx-auto w-11/12 max-w-xl">
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
      <img
        src={skuMapToDelete?.product_image_url}
        alt="product thumbnail"
        class="h-16 w-16 rounded-md object-cover sm:h-20 sm:w-20"
      />
    </div>
    <div class="mt-4 flex justify-center">
      <button on:click={deleteSkuMapping} class="btn btn-error"> Yes, Delete </button>
    </div>
  </div>
</div>
<!-- DELETE SKU MAPPING MODAL ENDS -->
