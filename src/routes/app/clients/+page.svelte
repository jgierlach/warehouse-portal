<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'

  // Import components
  import CreateInvoice from '$lib/components/CreateInvoice.svelte'

  // Import utility functions
  import { formatDollarValue } from '$lib/utils'

  // Import props
  export let data

  // Import stores
  import { clients, loadClients } from '$lib/stores/clients.js'
  import { selectedSection, setSelectedSection } from '$lib/stores/selectedSection'
  import {
    selectedClientToInvoice,
    setSelectedClientToInvoice,
  } from '$lib/stores/selectedClientToInvoice.js'

  // Execute onMount
  onMount(() => {
    loadClients(data.supabase)
    setSelectedSection('Clients')
  })

  // Component specific variables and business logic
  $: activeClients = $clients
    .filter(
      (client) =>
        client.username !== 'wesley@hometown-industries.com' &&
        client.username !== 'susan@hometown-industries.com',
    )
    .sort((a, b) => a.company_name.localeCompare(b.company_name))

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
  let per_pallet_monthly_storage_fee = 20.0
  let stripe_customer_id = ''
  let pass_on_card_fees = true

  function resetUserFields() {
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
    per_pallet_monthly_storage_fee = 20.0
    stripe_customer_id = ''
    pass_on_card_fees = true
  }

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
        per_pallet_monthly_storage_fee,
        stripe_customer_id,
        pass_on_card_fees,
      }),
    })
    if (response.ok) {
      loadClients(data.supabase)
      showAddUserModal = false
      resetUserFields()
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
        per_pallet_monthly_storage_fee,
        stripe_customer_id,
        pass_on_card_fees,
      }),
    })
    if (response.ok) {
      loadClients(data.supabase)
      showEditUserModal = false
      resetUserFields()
    } else {
      const errorData = await response.json()
      alert(`Failed to edit client billing details: ${errorData.message}`)
    }
  }
</script>

{#if $selectedSection === 'Clients'}
  <div class="mt-4 flex justify-center px-2 sm:px-4 md:mt-10">
    <div class="w-full max-w-7xl rounded-lg bg-base-100 p-2 shadow-xl sm:p-4">
      <h1 class="mb-2 text-center text-2xl font-bold sm:text-3xl">3PL Clients</h1>
      <div class="mb-2 flex justify-center">
        <a
          href="https://3pl-client-portal.vercel.app/app"
          target="_blank"
          class="btn btn-outline btn-sm">Open Client Portal</a
        >
      </div>
      <div class="mb-4 flex justify-center">
        <button
          on:click={() => {
            resetUserFields()
            showAddUserModal = true
          }}
          class="btn btn-outline btn-primary btn-sm"
          >Add Client <i class="fas fa-plus ml-1"></i>
        </button>
      </div>

      <!-- Table for medium screens and up -->
      <div class="hidden overflow-x-auto md:block">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Username</th>
              <th>Password</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each activeClients as client}
              <tr class:!bg-red-100={client.per_order_fee === 0}>
                <td>{client.company_name}</td>
                <td>{client.username}</td>
                <td>{client.password}</td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <button
                      on:click={() => {
                        showEditUserModal = true
                        userToEdit = client
                        hasLotNumbers = client.has_lot_numbers
                        per_order_fee = client.per_order_fee
                        per_order_unit_fee = client.per_order_unit_fee
                        per_unit_fba_pack_prep = client.per_unit_fba_pack_prep
                        per_unit_wfs_pack_prep = client.per_unit_wfs_pack_prep
                        b2b_freight_percentage_markup = client.b2b_freight_percentage_markup
                        per_pallet_monthly_storage_fee = client.per_pallet_monthly_storage_fee
                        stripe_customer_id = client.stripe_customer_id
                        pass_on_card_fees = client.pass_on_card_fees
                      }}
                      class="btn btn-info btn-xs sm:btn-sm">Edit</button
                    >
                    <button
                      on:click={() => {
                        showDeleteUserModal = true
                        userToDelete = client
                      }}
                      class="btn btn-error btn-xs sm:btn-sm">Delete</button
                    >
                    <button
                      on:click={() => {
                        setSelectedSection('Create Invoice')
                        setSelectedClientToInvoice(client)
                      }}
                      class="btn btn-primary btn-xs sm:btn-sm"
                    >
                      Invoice
                    </button>
                    <button
                      on:click={() => {
                        showClientBillingTermsModal = true
                        clientBillingTermsToDisplay = client
                      }}
                      class="btn btn-outline btn-xs sm:btn-sm">Billing</button
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
        {#each activeClients as client}
          <div
            class="card bg-base-200 shadow-md"
            class:border-l-4={client.per_order_fee === 0}
            class:border-red-400={client.per_order_fee === 0}
          >
            <div class="card-body p-4">
              <h3 class="text-lg font-bold">{client.company_name}</h3>

              <div class="mt-1">
                <p class="text-sm">
                  <span class="font-semibold">Username:</span>
                  {client.username}
                </p>
                <p class="text-sm">
                  <span class="font-semibold">Password:</span>
                  {client.password}
                </p>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  on:click={() => {
                    showEditUserModal = true
                    userToEdit = client
                    hasLotNumbers = client.has_lot_numbers
                    per_order_fee = client.per_order_fee
                    per_order_unit_fee = client.per_order_unit_fee
                    per_unit_fba_pack_prep = client.per_unit_fba_pack_prep
                    per_unit_wfs_pack_prep = client.per_unit_wfs_pack_prep
                    b2b_freight_percentage_markup = client.b2b_freight_percentage_markup
                    per_pallet_monthly_storage_fee = client.per_pallet_monthly_storage_fee
                    stripe_customer_id = client.stripe_customer_id
                    pass_on_card_fees = client.pass_on_card_fees
                  }}
                  class="btn btn-info btn-xs">Edit</button
                >
                <button
                  on:click={() => {
                    showDeleteUserModal = true
                    userToDelete = client
                  }}
                  class="btn btn-error btn-xs">Delete</button
                >
                <button
                  on:click={() => {
                    setSelectedSection('Create Invoice')
                    setSelectedClientToInvoice(client)
                  }}
                  class="btn btn-primary btn-xs"
                >
                  Create Invoice
                </button>
                <button
                  on:click={() => {
                    showClientBillingTermsModal = true
                    clientBillingTermsToDisplay = client
                  }}
                  class="btn btn-outline btn-xs">Billing Terms</button
                >
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- VIEW BILLING TERMS MODAL BEGINS -->
  <div class={`modal ${showClientBillingTermsModal ? 'modal-open' : ''}`}>
    <div class="modal-box relative mx-auto w-11/12 max-w-xl">
      <button
        on:click={() => (showClientBillingTermsModal = false)}
        class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
      >
      <h1 class="mt-2 text-center text-lg font-bold">
        {clientBillingTermsToDisplay.company_name} - Billing Terms
      </h1>
      <div class="prose mt-5 flex max-w-full justify-center">
        <ul class="w-full">
          <li class="flex flex-wrap justify-between">
            <span>Per Order Fee:</span>
            <strong>{formatDollarValue(clientBillingTermsToDisplay.per_order_fee)}</strong>
          </li>
          <li class="flex flex-wrap justify-between">
            <span>Per Order Unit Fee:</span>
            <strong>{formatDollarValue(clientBillingTermsToDisplay.per_order_unit_fee)}</strong>
          </li>
          <li class="flex flex-wrap justify-between">
            <span>FBA Pack and Prep:</span>
            <strong>{formatDollarValue(clientBillingTermsToDisplay.per_unit_fba_pack_prep)}</strong>
          </li>
          <li class="flex flex-wrap justify-between">
            <span>WFS Pack and Prep:</span>
            <strong>{formatDollarValue(clientBillingTermsToDisplay.per_unit_wfs_pack_prep)}</strong>
          </li>
          <li class="flex flex-wrap justify-between">
            <span>B2B Freight Markup:</span>
            <strong>{clientBillingTermsToDisplay.b2b_freight_percentage_markup}%</strong>
          </li>
          <li class="flex flex-wrap justify-between">
            <span>Per Pallet Monthly Storage:</span>
            <strong
              >{formatDollarValue(
                clientBillingTermsToDisplay.per_pallet_monthly_storage_fee,
              )}</strong
            >
          </li>
        </ul>
      </div>
    </div>
  </div>
  <!-- VIEW BILLING TERMS MODAL ENDS -->

  <!-- EDIT USER MODAL BEGINS -->
  <div class={`modal ${showEditUserModal ? 'modal-open' : ''}`}>
    <div class="modal-box relative mx-auto w-11/12 max-w-xl">
      <button
        on:click={() => (showEditUserModal = false)}
        class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
      >
      <form on:submit={editUser} class="max-h-[70vh] overflow-y-auto">
        <h3 class="text-center text-xl font-bold">{userToEdit?.company_name} - Edit Details</h3>
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
          <label class="label" for="b2bFreightPercentageMarkup">B2B Freight Percentage Markup</label
          >
          <input
            type="number"
            step="0.01"
            placeholder="B2B Freight Percentage Markup"
            bind:value={b2b_freight_percentage_markup}
            class="input input-bordered mb-2 bg-base-200"
          />
          <label class="label" for="perPalletMonthlyStorageFee"
            >Per Pallet Monthly Storage Fee</label
          >
          <input
            type="number"
            step="0.01"
            placeholder="Per Pallet Monthly Storage Fee"
            bind:value={per_pallet_monthly_storage_fee}
            class="input input-bordered mb-2 bg-base-200"
          />
          <label class="label" for="pass_on_card_fees">Pass On Card Fees</label>
          <select class="select select-bordered bg-base-200" bind:value={pass_on_card_fees}>
            <option value={true}>TRUE</option>
            <option value={false}>FALSE</option>
          </select>
          <label class="label" for="stripeCustomerId">Stripe Customer Id</label>
          <input
            type="text"
            placeholder="Stripe Customer Id"
            bind:value={stripe_customer_id}
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
    <div class="modal-box relative mx-auto w-11/12 max-w-xl">
      <button
        on:click={() => (showAddUserModal = false)}
        class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
      >
      <form on:submit={createUser} class="max-h-[70vh] overflow-y-auto">
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
          <label class="label" for="b2bFreightPercentageMarkup">B2B Freight Percentage Markup</label
          >
          <input
            type="number"
            step="0.01"
            placeholder="B2B Freight Percentage Markup"
            bind:value={b2b_freight_percentage_markup}
            class="input input-bordered mb-2 bg-base-200"
          />
          <label class="label" for="perPalletMonthlyStorageFee"
            >Per Pallet Monthly Storage Fee</label
          >
          <input
            type="number"
            step="0.01"
            placeholder="Per Pallet Monthly Storage Fee"
            bind:value={per_pallet_monthly_storage_fee}
            class="input input-bordered mb-2 bg-base-200"
          />
          <label class="label" for="pass_on_card_fees">Pass On Card Fees</label>
          <select class="select select-bordered bg-base-200" bind:value={pass_on_card_fees}>
            <option value={true}>TRUE</option>
            <option value={false}>FALSE</option>
          </select>
          <label class="label" for="stripeCustomerId">Stripe Customer Id</label>
          <input
            type="text"
            placeholder="Stripe Customer Id"
            bind:value={stripe_customer_id}
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
    <div class="modal-box relative mx-auto w-11/12 max-w-xl">
      <button
        on:click={() => (showDeleteUserModal = false)}
        class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
      >
      <h1 class="mt-2 text-center text-lg font-bold">
        Are you sure you want to delete this client?
      </h1>
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
{/if}

{#if $selectedSection === 'Create Invoice'}
  <CreateInvoice supabase={data.supabase} />
{/if}
