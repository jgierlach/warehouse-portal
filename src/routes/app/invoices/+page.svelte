<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'

  // Props
  export let data

  // Import components
  import Loading from '$lib/components/Loading.svelte'

  // Import utils
  import {
    generateBillingMonthsAndYears,
    getCurrentBillingMonthAndYear,
    formatDollarValue,
    findInvoiceLineItemsForSelectedMonth,
    alphabetizeByCompanyName,
    calculateRevenueBilledForSelectedMonth,
    calculateRevenueCollectedForSelectedMonth,
    generateCompanyNames,
    generateClientIds,
    generateInvoicesForSelectedMonth,
  } from '$lib/utils.js'

  // Stores
  import { invoiceLineItems, loadInvoiceLineItems } from '$lib/stores/invoiceLineItems'
  import { clients, loadClients } from '$lib/stores/clients.js'

  $: billingMonthsAndYears = generateBillingMonthsAndYears($invoiceLineItems)

  let selectedBillingMonthAndYear = getCurrentBillingMonthAndYear()

  // Execute onMount
  onMount(async () => {
    await loadInvoiceLineItems(data.supabase)
    await loadClients(data.supabase)
  })

  $: companyNames = generateCompanyNames($clients)

  $: clientIds = generateClientIds($clients)

  $: invoiceLineItemsForSelectedMonth = findInvoiceLineItemsForSelectedMonth(
    $invoiceLineItems,
    selectedBillingMonthAndYear,
  )

  $: invoiceLineItemsForSelectedMonthAlphabetized = alphabetizeByCompanyName(
    invoiceLineItemsForSelectedMonth,
  )

  $: invoicesForSelectedMonth = generateInvoicesForSelectedMonth(
    invoiceLineItemsForSelectedMonthAlphabetized,
  )

  $: revenueBilledForSelectedMonth = calculateRevenueBilledForSelectedMonth(
    invoiceLineItemsForSelectedMonth,
  )

  $: collectedRevenueForSelectedMonth = calculateRevenueCollectedForSelectedMonth(
    invoiceLineItemsForSelectedMonth,
  )

  $: accountsReceivableForSelectedMonth =
    revenueBilledForSelectedMonth - collectedRevenueForSelectedMonth

  $: percentCollectedForSelectedMonth = (
    (collectedRevenueForSelectedMonth / revenueBilledForSelectedMonth) *
    100
  ).toFixed(2)

  let loading = false

  async function updatePaymentStatus(paymentStatus, lineItemId) {
    console.log('Payment Status', paymentStatus)
    if (paymentStatus === 'Paid') {
      paymentStatus = 'Unpaid'
    } else {
      paymentStatus = 'Paid'
    }
    const response = await fetch('/app/api/invoices/updatePaymentStatus', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentStatus,
        lineItemId,
      }),
    })
    if (response.ok) {
      // Load invoice line items
      await loadInvoiceLineItems(data.supabase)
    } else {
      const errorData = await response.json()
      console.error(errorData)
      alert(`Failed to update payment status: ${errorData.message}`)
    }
  }

  async function updateInvoicePaymentStatus(paymentStatus, invoice) {
    const lineItems = invoice.line_items_for_company
    for (let i = 0; i <= lineItems.length; i++) {
      let lineItem = lineItems[i]
      await updatePaymentStatus(paymentStatus, lineItem.id)
    }
  }

  let showDeleteLineItemModal = false
  let lineItemToDelete = {}

  async function deleteLineItem(id) {
    loading = true
    const response = await fetch('/app/api/invoices/deleteLineItem', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
      }),
    })
    if (response.ok) {
      await loadInvoiceLineItems(data.supabase)
    } else {
      const errorData = await response.json()
      alert(`Failed to delete inboundShipments: ${errorData.message}`)
    }
    lineItemToDelete = {}
    showDeleteLineItemModal = false
    loading = false
  }

  // Invoice line item fields
  let companyName = ''
  $: clientId = $clients.find((client) => client?.company_name === companyName)?.username
  $: userId = $clients.find((client) => client?.username === clientId)?.id
  let billingMonth = ''
  let lineItemName = ''
  let billingTerms = ''
  let cost = 0
  let stripeInvoiceId = ''
  $: stripeDashboardUrl = `https://dashboard.stripe.com/invoices/${stripeInvoiceId}`
  let stripeInvoiceUrl = ''
  let paymentStatus = ''

  let showEditLineItemModal = false
  let lineItemToEdit = {}

  async function editLineItem() {
    loading = true
    const response = await fetch('/app/api/invoices/editLineItem', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: lineItemToEdit?.id,
        billingMonth,
        companyName,
        lineItemName,
        billingTerms,
        cost,
        stripeInvoiceId,
        stripeDashboardUrl,
        stripeInvoiceUrl,
        paymentStatus,
      }),
    })
    if (response.ok) {
      await loadInvoiceLineItems(data.supabase)
      lineItemToEdit = {}
      clearLineItemFields()
    } else {
      const errorData = await response.json()
      alert(`Failed to edit line item: ${errorData.message}`)
    }
    loading = false
    showEditLineItemModal = false
  }

  let addLineItemModal = false

  async function addLineItem() {
    loading = true
    const formattedLineItems = [
      {
        user_id: userId,
        client_id: clientId,
        billing_month: billingMonth,
        company_name: companyName,
        line_item_name: lineItemName,
        line_item_cost: cost,
        line_item_billing_terms: billingTerms,
        stripe_invoice_url: stripeInvoiceUrl,
        payment_status: paymentStatus,
      },
    ]
    const response = await fetch('/app/api/invoices/createLineItems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formattedLineItems,
      }),
    })
    if (response.ok) {
      await loadInvoiceLineItems(data.supabase)
      clearLineItemFields()
    } else {
      const errorData = await response.json()
      alert(`Failed to add line item: ${errorData.message}`)
    }
    loading = false
    addLineItemModal = false
  }

  function clearLineItemFields() {
    billingMonth = ''
    companyName = ''
    lineItemName = ''
    billingTerms = ''
    cost = 0
    stripeInvoiceId = ''
    stripeDashboardUrl = ''
    stripeInvoiceUrl = ''
    paymentStatus = ''
  }

  function setLineItemFields(lineItem) {
    billingMonth = lineItem.billing_month
    companyName = lineItem.company_name
    lineItemName = lineItem.line_item_name
    billingTerms = lineItem.line_item_billing_terms
    cost = lineItem.line_item_cost
    stripeInvoiceId = lineItem.stripe_invoice_id
    stripeDashboardUrl = lineItem.stripe_dashboard_url
    stripeInvoiceUrl = lineItem.stripe_invoice_url
    paymentStatus = lineItem.payment_status
  }

  let displaySetting = 'invoices'

  let showInvoiceLineItemsModal = false
  let invoiceToDisplayLineItems = {}
  $: selectedLineItems = invoiceToDisplayLineItems?.line_items_for_company

  function sendToCollections(userId, clientId) {
    goto(`/app/collections?userId=${userId}&clientId=${clientId}`)
  }
</script>

<Loading {loading} />
<div class="mt-10 flex justify-center">
  <div class="ml-10 mr-10 w-full rounded-lg bg-base-100 p-4 shadow-xl">
    <h1 class="text-center text-3xl font-bold">
      {selectedBillingMonthAndYear} - Invoices
    </h1>
    <div class="mt-2 flex justify-center">
      <button
        on:click={() => {
          clearLineItemFields()
          addLineItemModal = true
        }}
        class="btn btn-primary btn-sm flex items-center gap-2"
      >
        Add Line Item
        <i class="fas fa-plus"></i>
      </button>
    </div>
    <div class="mb-5 mt-2 flex justify-center">
      <div class="flex flex-col items-center">
        <label class="label font-semibold" for="selectedBillingMonthAndYear">
          Select Billing Month And Year
        </label>
        <select
          class="select select-bordered mt-2 bg-base-200"
          bind:value={selectedBillingMonthAndYear}
        >
          {#each billingMonthsAndYears as monthAndYear}
            <option value={monthAndYear}>{monthAndYear}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="flex justify-center">
      <table class="table max-w-10 shadow-lg">
        <thead>
          <tr>
            <th>Billed Revenue</th>
            <th>Collected Revenue</th>
            <th>Accounts Receivable</th>
            <th>Percent Collected</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{formatDollarValue(revenueBilledForSelectedMonth)}</td>
            <td>{formatDollarValue(collectedRevenueForSelectedMonth)}</td>
            <td>{formatDollarValue(accountsReceivableForSelectedMonth)}</td>
            <td>{percentCollectedForSelectedMonth}%</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-center">
      <button
        on:click={() => (displaySetting = 'invoices')}
        class:btn-active={displaySetting === 'invoices'}
        class="btn">Invoices</button
      >
      <button
        on:click={() => (displaySetting = 'line items')}
        class:btn-active={displaySetting === 'line items'}
        class="btn">Line Items</button
      >
    </div>

    {#if displaySetting === 'line items'}
      <div class="mt-5 overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Billing Month</th>
              <th>Company Name</th>
              <th>Services Provided</th>
              <th>Billing Terms</th>
              <th>Cost</th>
              <th>Stripe Invoice Url</th>
              <th>Payment Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each invoiceLineItemsForSelectedMonthAlphabetized as lineItem}
              <tr>
                <td>{lineItem.billing_month}</td>
                <td>{lineItem.company_name}</td>
                <td>{lineItem.line_item_name}</td>
                <td>{lineItem.line_item_billing_terms}</td>
                <td>{formatDollarValue(lineItem.line_item_cost)}</td>
                <td
                  ><a
                    class="link-primary font-semibold underline"
                    href={lineItem.stripe_dashboard_url}
                    target="_blank">Dashboard Url</a
                  ></td
                >
                <td
                  ><a
                    class="link-primary font-semibold underline"
                    href={lineItem.stripe_invoice_url}
                    target="_blank">Invoice</a
                  ></td
                >
                <td
                  ><button
                    on:click={() => updatePaymentStatus(lineItem.payment_status, lineItem.id)}
                    class="btn btn-sm"
                    class:btn-accent={lineItem.payment_status === 'Paid'}
                    class:btn-error={lineItem.payment_status === 'Unpaid'}
                    >{lineItem.payment_status}</button
                  ></td
                >
                <td>
                  <div class="flex space-x-1">
                    <button
                      on:click={() => {
                        clearLineItemFields()
                        setLineItemFields(lineItem)
                        lineItemToEdit = lineItem
                        showEditLineItemModal = true
                      }}
                      class="btn btn-info btn-sm">Edit</button
                    >
                    <button
                      on:click={() => {
                        showDeleteLineItemModal = true
                        lineItemToDelete = lineItem
                      }}
                      class="btn btn-error btn-sm">Delete</button
                    >
                    <!-- <button class="btn btn-warning btn-sm">Send Collection Email</button> -->
                  </div></td
                >
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
    {#if displaySetting === 'invoices'}
      <div class="mt-5 overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Billing Month</th>
              <th>Company Name</th>
              <th>Invoice Total</th>
              <th>Stripe Dashboard Url</th>
              <th>Stripe Invoice Url</th>
              <th>Payment Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each invoicesForSelectedMonth as invoice}
              <tr>
                <td>{invoice.billing_month}</td>
                <td>{invoice.company_name}</td>
                <td>{formatDollarValue(invoice.invoice_total)}</td>
                <td
                  ><a
                    class="link-primary font-semibold underline"
                    href={invoice.stripe_dashboard_url}
                    target="_blank">Dashboard Url</a
                  ></td
                >
                <td
                  ><a
                    class="link-primary font-semibold underline"
                    href={invoice.stripe_invoice_url}
                    target="_blank">Invoice</a
                  ></td
                >
                <td
                  ><button
                    on:click={async () =>
                      await updateInvoicePaymentStatus(
                        invoice.is_paid ? 'Paid' : 'Unpaid',
                        invoice,
                      )}
                    class="btn btn-sm"
                    class:btn-accent={invoice.is_paid}
                    class:btn-error={!invoice.is_paid}>{invoice.is_paid ? 'Paid' : 'Unpaid'}</button
                  ></td
                >
                <td>
                  <div class="flex space-x-1">
                    <button
                      on:click={() => {
                        invoiceToDisplayLineItems = invoice
                        showInvoiceLineItemsModal = true
                      }}
                      class="btn btn-sm">View Line Items</button
                    >
                    <button
                      on:click={() => sendToCollections(invoice.user_id, invoice.client_id)}
                      class="btn btn-warning btn-sm">Send Collection Email</button
                    >
                  </div></td
                >
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- DELETE LINE ITEM MODAL BEGINS -->
<div class={`modal ${showDeleteLineItemModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (showDeleteLineItemModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mt-2 text-center text-lg font-bold">
      Are you sure you want to delete this line item?
    </h1>
    <p class="entry-content py-4 text-center" style="white-space: pre-line;">
      {lineItemToDelete?.company_name} - {lineItemToDelete?.line_item_name}
    </p>
    <div class="mt-1 flex justify-center">
      <button on:click={() => deleteLineItem(lineItemToDelete?.id)} class="btn btn-error">
        Yes, Delete
      </button>
    </div>
  </div>
</div>
<!-- DELTE LINE ITEM MODAL ENDS -->

<!-- EDIT LINE ITEM MODAL BEGINS -->
<div class={`modal ${showEditLineItemModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (showEditLineItemModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Edit Line Item</h1>
    <form on:submit|preventDefault={editLineItem}>
      <!-- Billing month and year dropdown -->
      <div class="form-control mb-4">
        <label class="label" for="billingMonth">Billing Month And Year</label>
        <select
          required
          class="select select-bordered bg-base-200"
          id="billingMonth"
          bind:value={billingMonth}
        >
          <option value="" disabled>Select Billing Month And Year</option>
          {#each billingMonthsAndYears as billingMonth}
            <option value={billingMonth}>{billingMonth}</option>
          {/each}
        </select>
      </div>

      <!-- Company Name -->
      <div class="form-control mb-4">
        <label class="label" for="billingMonth">Company Name</label>
        <select
          required
          class="select select-bordered bg-base-200"
          id="billingMonth"
          bind:value={companyName}
        >
          <option value="" disabled>Select Company Name</option>
          {#each companyNames as companyName}
            <option value={companyName}>{companyName}</option>
          {/each}
        </select>
      </div>

      <!-- Line Item Name -->
      <div class="form-control mb-4">
        <label class="label" for="lineItemName">Services Provided</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="lineItemName"
          bind:value={lineItemName}
          placeholder="Services Provided"
        />
      </div>

      <!-- Billing Terms -->
      <div class="form-control mb-4">
        <label class="label" for="billingTerms">Billing Terms</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="billingTerms"
          bind:value={billingTerms}
          placeholder="Billing Terms"
        />
      </div>

      <!-- Cost -->
      <div class="form-control mb-4">
        <label class="label" for="cost">Cost</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="cost"
          bind:value={cost}
          step="0.01"
          placeholder="0.00"
          inputmode="decimal"
        />
      </div>

      <!-- Stripe Invoice Id -->
      <div class="form-control mb-4">
        <label class="label" for="stripeInvoiceId">Stripe Invoice Id</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="stripeInvoiceId"
          bind:value={stripeInvoiceId}
          placeholder="Stripe Invoice Id"
        />
      </div>

      <!-- Stripe Dashboard Url -->
      <div class="form-control mb-4">
        <label class="label" for="stripeDashboardUrl">Stripe Dashboard Url</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="stripeDashboardUrl"
          bind:value={stripeDashboardUrl}
          placeholder="Stripe Dashboard Url"
        />
      </div>

      <!-- Stripe Invoice Url -->
      <div class="form-control mb-4">
        <label class="label" for="stripeInvoiceUrl">Stripe Invoice Url</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="stripeInvoiceUrl"
          bind:value={stripeInvoiceUrl}
          placeholder="Stripe Invoice Url"
        />
      </div>

      <!-- Status -->
      <div class="form-control mb-4">
        <label class="label" for="paymentStatus">Payment Status</label>
        <select
          class="select select-bordered bg-base-200"
          id="paymentStatus"
          bind:value={paymentStatus}
        >
          <!-- <option value="" disabled>Yes or No?</option> -->
          <option value={'Paid'}>Paid</option>
          <option value={'Unpaid'}>Unpaid</option>
        </select>
      </div>

      <!-- Submit Button -->
      <div class="mt-4 flex justify-center">
        <button class="btn btn-info" type="submit">Save</button>
      </div>
    </form>
  </div>
</div>
<!-- EDIT LINE ITEM MODAL ENDS -->

<!-- ADD LINE ITEM MODAL BEGINS -->
<div class={`modal ${addLineItemModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (addLineItemModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Add Line Item</h1>
    <form on:submit|preventDefault={addLineItem}>
      <!-- Billing month and year dropdown -->
      <div class="form-control mb-4">
        <label class="label" for="billingMonth">Billing Month And Year</label>
        <select
          required
          class="select select-bordered bg-base-200"
          id="billingMonth"
          bind:value={billingMonth}
        >
          <option value="" disabled>Select Billing Month And Year</option>
          {#each billingMonthsAndYears as billingMonth}
            <option value={billingMonth}>{billingMonth}</option>
          {/each}
        </select>
      </div>

      <!-- Company Names -->
      <div class="form-control mb-4">
        <label class="label" for="billingMonth">Company Names</label>
        <select
          required
          class="select select-bordered bg-base-200"
          id="billingMonth"
          bind:value={companyName}
        >
          <option value="" disabled>Select Company Name</option>
          {#each companyNames as companyName}
            <option value={companyName}>{companyName}</option>
          {/each}
        </select>
      </div>

      <!-- Client Id -->
      <div class="form-control mb-4">
        <label class="label" for="clientId">Client Id</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="clientId"
          bind:value={clientId}
          placeholder="Client Id"
        />
      </div>

      <!-- Line Item Name -->
      <div class="form-control mb-4">
        <label class="label" for="lineItemName">Services Provided</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="lineItemName"
          bind:value={lineItemName}
          placeholder="Services Provided"
        />
      </div>

      <!-- Billing Terms -->
      <div class="form-control mb-4">
        <label class="label" for="billingTerms">Billing Terms</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="billingTerms"
          bind:value={billingTerms}
          placeholder="Billing Terms"
        />
      </div>

      <!-- Cost -->
      <div class="form-control mb-4">
        <label class="label" for="cost">Cost</label>
        <input
          class="input input-bordered bg-base-200"
          type="number"
          id="cost"
          bind:value={cost}
          step="0.01"
          placeholder="0.00"
          inputmode="decimal"
        />
      </div>

      <!-- Stripe Invoice Id -->
      <div class="form-control mb-4">
        <label class="label" for="stripeInvoiceId">Stripe Invoice Id</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="stripeInvoiceId"
          bind:value={stripeInvoiceId}
          placeholder="Stripe Invoice Id"
        />
      </div>

      <!-- Stripe Dashboard Url -->
      <div class="form-control mb-4">
        <label class="label" for="stripeDashboardUrl">Stripe Dashboard Url</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="stripeDashboardUrl"
          bind:value={stripeDashboardUrl}
          placeholder="Stripe Dashboard Url"
        />
      </div>

      <!-- Stripe Invoice Url -->
      <div class="form-control mb-4">
        <label class="label" for="stripeInvoiceUrl">Stripe Invoice Url</label>
        <input
          class="input input-bordered bg-base-200"
          type="text"
          id="stripeInvoiceUrl"
          bind:value={stripeInvoiceUrl}
          placeholder="Stripe Invoice Url"
        />
      </div>

      <!-- Status -->
      <div class="form-control mb-4">
        <label class="label" for="paymentStatus">Payment Status</label>
        <select
          class="select select-bordered bg-base-200"
          id="paymentStatus"
          bind:value={paymentStatus}
        >
          <!-- <option value="" disabled>Yes or No?</option> -->
          <option value={'Unpaid'}>Unpaid</option>
          <option value={'Paid'}>Paid</option>
        </select>
      </div>

      <!-- Submit Button -->
      <div class="mt-4 flex justify-center">
        <button class="btn btn-info" type="submit">Submit</button>
      </div>
    </form>
  </div>
</div>
<!-- ADD LINE ITEM MODAL ENDS -->

<!-- INVOICE LINE ITEMS MODAL BEGINS -->
<div class={`modal ${showInvoiceLineItemsModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative bg-base-100">
    <button
      on:click={() => (showInvoiceLineItemsModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mt-2 text-center text-lg font-bold">
      {invoiceToDisplayLineItems?.company_name} - Line Items
    </h1>
    <div class="mt-5 flex justify-center">
      <table class="table table-zebra bg-base-100 shadow-lg">
        <thead>
          <tr>
            <th>Billing Month</th>
            <th>Service Name</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          {#if selectedLineItems !== undefined}
            {#each selectedLineItems as lineItem}
              <tr>
                <td>{lineItem?.billing_month}</td>
                <td>{lineItem?.line_item_name}</td>
                <td>{formatDollarValue(lineItem?.line_item_cost)}</td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
<!-- INVOICE LINE ITEMS MODAL ENDS -->
