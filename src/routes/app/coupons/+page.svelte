<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'

  // Import props
  export let data

  // Import utils
  import { formatTimeStampForChangelog } from '$lib/utils.js'

  // Import stores
  import { coupons, loadCoupons } from '$lib/stores/coupons.js'

  // Execute onMount
  onMount(() => {
    loadCoupons(data.supabase)
  })
</script>

<div class="mt-4 flex justify-center px-2 sm:px-4 md:mt-10">
  <div class="w-full max-w-4xl rounded-lg bg-base-100 p-2 shadow-xl sm:p-4">
    <h1 class="mb-3 text-center text-2xl font-bold sm:mb-5 sm:text-3xl">Coupons</h1>
    <!-- Table for medium screens and up -->
    <div class="hidden overflow-x-auto md:block">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Date Added</th>
            <th>Client Id</th>
            <th>Coupon Code</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each $coupons as coupon}
            <tr>
              <td>{formatTimeStampForChangelog(coupon?.created_at)}</td>
              <td>{coupon?.client_id}</td>
              <td>{coupon?.name}</td>
              <td>
                <div class="flex space-x-2">
                  <button class="btn btn-info btn-sm">Edit</button>
                  <button class="btn btn-error btn-sm">Delete</button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
