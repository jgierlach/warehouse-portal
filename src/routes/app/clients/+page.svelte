<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'

  // Import components
  import Loading from '$lib/components/Loading.svelte'

  // Import utility functions
  import { formatDollarValue } from '$lib/utils'

  // Import props
  export let data

  // Import stores
  import { clients, loadClients } from '$lib/stores/clients.js'

  // Execute onMount
  onMount(() => {
    loadClients(data.supabase)
  })

  // Component specific variables and business logic
  $: activeClients = $clients.filter(
    (client) =>
      client.username !== 'wesley@hometown-industries.com' &&
      client.username !== 'susan@hometown-industries.com',
  )

  // Variables for displaying clients billing terms
  let showClientBillingTermsModal = false
  let clientBillingTermsToDisplay = {}

  // Variables and function to create a new 3PL client
  let showAddUserModal = false

  // User fields
  let company_name = ''
  let username = ''
  let password = ''
  let hasLotNumbers = false
  let isadmin = false
  let isclient = true
  let per_order_fee = 1.3
  let per_order_unit_fee = 0.3
  let per_unit_fba_pack_prep = 0.25
  let per_unit_wfs_pack_prep = 0.25
  let b2b_freight_percentage_markup = 10.0

  async function createUser() {
    const response = await fetch('/app/api/users/createUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name,
        username,
        password,
        hasLotNumbers,
        isadmin,
        isclient,
        per_order_fee,
        per_order_unit_fee,
        per_unit_fba_pack_prep,
        per_unit_wfs_pack_prep,
        b2b_freight_percentage_markup,
      }),
    })
    if (response.ok) {
      loadClients(data.supabase)
      showAddUserModal = false
      company_name = ''
      username = ''
      password = ''
      hasLotNumbers = false
      isadmin = false
      isclient = true
      per_order_fee = 1.3
      per_order_unit_fee = 0.3
      per_unit_fba_pack_prep = 0.25
      per_unit_wfs_pack_prep = 0.25
      b2b_freight_percentage_markup = 10.0
    } else {
      const errorData = await response.json()
      alert(`Failed to Create inventory: ${errorData.message}`)
    }
  }

  // Variables and function to delete user
  let showDeleteUserModal = false
  let userToDelete = {}

  async function deleteUser() {
    const id = userToDelete.id
    const createdAt = userToDelete.created_at
    const response = await fetch('/app/api/users/deleteUser', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        createdAt,
      }),
    })
    if (response.ok) {
      loadClients(data.supabase)
      userToDelete = {}
    } else {
      const errorData = await response.json()
      alert(`Failed to delete inventory: ${errorData.message}`)
    }
    userToDelete = {}
    showDeleteUserModal = false
  }

  // Variables and function to edit client billing details
  let showEditUserModal = false
  let userToEdit = {}
  async function editUser() {
    const response = await fetch('/app/api/users/editUser', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: userToEdit.id,
        hasLotNumbers,
        per_order_fee,
        per_order_unit_fee,
        per_unit_fba_pack_prep,
        per_unit_wfs_pack_prep,
        b2b_freight_percentage_markup,
      }),
    })
    if (response.ok) {
      loadClients(data.supabase)
      showEditUserModal = false
      hasLotNumbers = false
      per_order_fee = 1.3
      per_order_unit_fee = 0.3
      per_unit_fba_pack_prep = 0.25
      per_unit_wfs_pack_prep = 0.25
      b2b_freight_percentage_markup = 10.0
    } else {
      const errorData = await response.json()
      alert(`Failed to Create inventory: ${errorData.message}`)
    }
  }
</script>

<div class="mt-10 flex justify-center">
  <div class="ml-10 mr-10 bg-base-100 p-4 shadow-xl">
    <h1 class="mb-2 text-center text-3xl font-bold">3PL Clients</h1>
    <div class="mb-2 flex justify-center">
      <a
        href="https://3pl-client-portal.vercel.app/app"
        target="_blank"
        class="btn btn-outline btn-sm">Open Client Portal</a
      >
    </div>
    <div class="mb-4 flex justify-center">
      <button on:click={() => (showAddUserModal = true)} class="btn btn-outline btn-primary btn-sm"
        >Add Client <i class="fas fa-plus"></i>
      </button>
    </div>
    <table class="table table-zebra">
      <thead>
        <tr>
          <th>Company Name</th>
          <th>Username</th>
          <th>Password</th>
          <th>Has Lot #s</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each activeClients as client}
          <tr>
            <td>{client.company_name}</td>
            <td>{client.username}</td>
            <td>{client.password}</td>
            <td>{client.has_lot_numbers}</td>
            <td
              ><div class="flex space-x-1">
                <button
                  on:click={() => {
                    showEditUserModal = true
                    userToEdit = client
                  }}
                  class="btn btn-info btn-sm">Edit</button
                >
                <button
                  on:click={() => {
                    showDeleteUserModal = true
                    userToDelete = client
                  }}
                  class="btn btn-error btn-sm">Delete Client</button
                >
                <button
                  on:click={() => {
                    showClientBillingTermsModal = true
                    clientBillingTermsToDisplay = client
                  }}
                  class="btn btn-sm">View Billing Terms</button
                >
              </div></td
            >
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<!-- VIEW BILLING TERMS MODAL BEGINS -->
<div class={`modal ${showClientBillingTermsModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (showClientBillingTermsModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mt-2 text-center text-lg font-bold">
      {clientBillingTermsToDisplay.company_name} - Billing Terms
    </h1>
    <div class="prose mt-5 flex justify-center">
      <ul>
        <li>
          Per Order Fee: <strong
            >{formatDollarValue(clientBillingTermsToDisplay.per_order_fee)}</strong
          >
        </li>
        <li>
          Per Order Unit Fee: <strong
            >{formatDollarValue(clientBillingTermsToDisplay.per_order_unit_fee)}</strong
          >
        </li>
        <li>
          FBA Pack and Prep: <strong
            >{formatDollarValue(clientBillingTermsToDisplay.per_unit_fba_pack_prep)}</strong
          >
        </li>
        <li>
          WFS Pack and Prep: <strong
            >{formatDollarValue(clientBillingTermsToDisplay.per_unit_wfs_pack_prep)}</strong
          >
        </li>
        <li>
          B2B Freight Percentage Markup: <strong
            >{clientBillingTermsToDisplay.b2b_freight_percentage_markup}%</strong
          >
        </li>
      </ul>
    </div>
  </div>
</div>
<!-- VIEW BILLING TERMS MODAL ENDS -->

<!-- EDIT USER MODAL BEGINS -->
<div class={`modal ${showEditUserModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (showEditUserModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <form on:submit={editUser}>
      <h3 class="text-center text-xl font-bold">Edit Client Details</h3>
      <div class="form-control mt-4">
        <label class="label" for="hasLotNumbers">Has Lot Numbers</label>
        <select class="select select-bordered bg-base-200" bind:value={hasLotNumbers}>
          <option value={true}>TRUE</option>
          <option value={false}>FALSE</option>
        </select>
      </div>

      <div class="form-control mt-4">
        <label class="label" for="perOrderFee">Per Order Fee</label>
        <input
          type="number"
          step="0.01"
          placeholder="Per Order Fee"
          bind:value={per_order_fee}
          class="input input-bordered mb-2 bg-base-200"
        />
        <label class="label" for="perOrderUnitFee">Per Order Unit Fee</label>
        <input
          type="number"
          step="0.01"
          placeholder="Per Order Unit Fee"
          bind:value={per_order_unit_fee}
          class="input input-bordered mb-2 bg-base-200"
        />
        <label class="label" for="fbaPackAndPrep">FBA Pack and Prep</label>
        <input
          type="number"
          step="0.01"
          placeholder="Per Unit FBA Pack Prep"
          bind:value={per_unit_fba_pack_prep}
          class="input input-bordered mb-2 bg-base-200"
        />
        <label class="label" for="wfsFulfillmentServices">WFS Pack and Prep</label>
        <input
          type="number"
          step="0.01"
          placeholder="Per Unit WFS Pack Prep"
          bind:value={per_unit_wfs_pack_prep}
          class="input input-bordered mb-2 bg-base-200"
        />
        <label class="label" for="b2bFreightPercentageMarkup">B2B Freight Percentage Markup</label>
        <input
          type="number"
          step="0.01"
          placeholder="B2B Freight Percentage Markup"
          bind:value={b2b_freight_percentage_markup}
          class="input input-bordered mb-2 bg-base-200"
        />
        <div class="mt-4 flex justify-center">
          <button class="btn btn-primary" type="submit">Update</button>
        </div>
      </div>
    </form>
  </div>
</div>
<!-- EDIT USER MODAL ENDS -->

<!-- ADD USER MODAL BEGINS -->
<div class={`modal ${showAddUserModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (showAddUserModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <form on:submit={createUser}>
      <h3 class="text-center text-xl font-bold">Add New Client</h3>
      <div class="form-control mt-4">
        <label class="label" for="company_name">Company Name</label>
        <input
          type="text"
          placeholder="Company Name"
          bind:value={company_name}
          class="input input-bordered mb-2 bg-base-200"
        />
        <label class="label" for="clientId">Client Id</label>
        <input
          type="email"
          placeholder="Username (email)"
          bind:value={username}
          class="input input-bordered mb-2 bg-base-200"
        />
        <label class="label" for="password">Password</label>
        <input
          type="password"
          placeholder="Password"
          bind:value={password}
          class="input input-bordered mb-2 bg-base-200"
        />
        <!-- <div class="form-control mt-4"> -->
        <label class="label" for="hasLotNumbers">Has Lot Numbers</label>
        <select class="select select-bordered bg-base-200" bind:value={hasLotNumbers}>
          <option value={true}>TRUE</option>
          <option value={false}>FALSE</option>
        </select>
        <!-- </div> -->
        <label class="label" for="perOrderFee">Per Order Fee</label>
        <input
          type="number"
          step="0.01"
          placeholder="Per Order Fee"
          bind:value={per_order_fee}
          class="input input-bordered mb-2 bg-base-200"
        />
        <label class="label" for="perOrderUnitFee">Per Order Unit Fee</label>
        <input
          type="number"
          step="0.01"
          placeholder="Per Order Unit Fee"
          bind:value={per_order_unit_fee}
          class="input input-bordered mb-2 bg-base-200"
        />
        <label class="label" for="fbaPackAndPrep">FBA Pack and Prep</label>
        <input
          type="number"
          step="0.01"
          placeholder="Per Unit FBA Pack Prep"
          bind:value={per_unit_fba_pack_prep}
          class="input input-bordered mb-2 bg-base-200"
        />
        <label class="label" for="wfsFulfillmentServices">WFS Pack and Prep</label>
        <input
          type="number"
          step="0.01"
          placeholder="Per Unit WFS Pack Prep"
          bind:value={per_unit_wfs_pack_prep}
          class="input input-bordered mb-2 bg-base-200"
        />
        <label class="label" for="b2bFreightPercentageMarkup">B2B Freight Percentage Markup</label>
        <input
          type="number"
          step="0.01"
          placeholder="B2B Freight Percentage Markup"
          bind:value={b2b_freight_percentage_markup}
          class="input input-bordered mb-2 bg-base-200"
        />
        <div class="mt-4 flex justify-center">
          <button class="btn btn-primary" type="submit">Submit</button>
        </div>
      </div>
    </form>
  </div>
</div>
<!-- ADD USER MODAL ENDS -->

<!-- DELETE USER MODAL BEGINS -->
<div class={`modal ${showDeleteUserModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (showDeleteUserModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mt-2 text-center text-lg font-bold">Are you sure you want to delete this client?</h1>
    <p class="entry-content py-4 text-center" style="white-space: pre-line;">
      {userToDelete.company_name}
    </p>
    <div class="flex justify-center">
      <button
        on:click={() => deleteUser(userToDelete.id, userToDelete.created_at)}
        class="btn btn-error"
      >
        Yes, Delete
      </button>
    </div>
  </div>
</div>
<!-- DELETE USER MODAL ENDS -->
