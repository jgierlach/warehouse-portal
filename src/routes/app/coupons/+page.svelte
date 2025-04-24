<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'

  // Import props
  export let data

  // Import utils
  import { formatTimeStampForChangelog } from '$lib/utils.js'

  // Import stores
  import { coupons, loadCoupons } from '$lib/stores/coupons.js'

  // Coupon fields
  let client_id = ''
  let name = ''

  let showEditCouponModal = false
  let couponToEdit = {}
  async function editCoupon(event) {
    event.preventDefault()
    const response = await fetch('/app/api/coupons/editCoupon', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: couponToEdit?.id,
        client_id,
        name,
      }),
    })
    if (response.ok) {
      await loadCoupons(data.supabase)
      resetCouponFields()
    } else {
      const errorData = await response.json()
      console.error(errorData)
      alert(`Failed to edit product: ${errorData.message}`)
    }
    showEditCouponModal = false
  }

  function resetCouponFields() {
    couponToEdit = {}
    client_id = ''
    name = ''
  }

  function setCouponFields(coupon) {
    couponToEdit = coupon
    client_id = coupon?.client_id
    name = coupon?.name
  }

  async function deleteCoupon(id) {
    const response = await fetch(`/app/api/coupons/deleteCoupon`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
      }),
    })
    if (response.ok) {
      await loadCoupons(data.supabase)
    } else {
      const errorData = await response.json()
      console.error(errorData)
      alert(`Failed to delete coupon: ${errorData.message}`)
    }
  }

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
                  <button
                    on:click={() => {
                      setCouponFields(coupon)
                      showEditCouponModal = true
                    }}
                    class="btn btn-info btn-sm">Edit</button
                  >
                  <button on:click={() => deleteCoupon(coupon?.id)} class="btn btn-error btn-sm"
                    >Delete</button
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

<!-- EDIT Coupon MODAL BEGINS -->
<div class={`modal ${showEditCouponModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (showEditCouponModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <form on:submit={editCoupon}>
      <h3 class="text-center text-xl font-bold">Edit Coupon</h3>
      <div class="form-control mt-4">
        <label class="label" for="brand_name">Client Id</label>
        <input
          type="text"
          placeholder="Client Id"
          bind:value={client_id}
          class="input input-bordered mb-2 bg-base-200"
        />
        <label class="label" for="clientId">Name</label>
        <input
          type="text"
          placeholder="Coupon Name"
          bind:value={name}
          class="input input-bordered mb-2 bg-base-200"
        />

        <div class="mt-4 flex justify-center">
          <button class="btn btn-primary" type="submit">Submit</button>
        </div>
      </div>
    </form>
  </div>
</div>
<!-- EDIT Coupon MODAL ENDS -->
