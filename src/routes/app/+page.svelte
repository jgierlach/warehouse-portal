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
    <h1 class="mb-4 text-center text-3xl font-bold">Client Inventory</h1>
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
              ><button class="btn btn-outline btn-info btn-sm mr-2">Edit</button>
              <button class="btn btn-outline btn-error btn-sm">Delete</button></td
            >
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
