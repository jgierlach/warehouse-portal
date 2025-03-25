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
    isInvoicePastDue,
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
  let dateDue = ''

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
        dateDue,
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
        date_due: dateDue,
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
    dateDue = ''
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
    dateDue = lineItem.date_due
  }

  let displaySetting = 'invoices'

  let showInvoiceLineItemsModal = false
  let invoiceToDisplayLineItems = {}
  $: selectedLineItems = invoiceToDisplayLineItems?.line_items_for_company

  function sendToCollections(userId, clientId) {
    goto(`/app/collections?userId=${userId}&clientId=${clientId}`)
  }

  let showEditInvoiceModal = false
  function setInvoiceFields(invoice) {
    billingMonth = invoice.billing_month
    companyName = invoice.company_name
    stripeInvoiceId = invoice.stripe_invoice_id
    stripeDashboardUrl = invoice.stripe_dashboard_url
    stripeInvoiceUrl = invoice.stripe_invoice_url
    dateDue = invoice.date_due
  }

  async function editInvoice() {
    loading = true
    const response = await fetch('/app/api/invoices/editInvoice', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        billingMonth,
        companyName,
        stripeInvoiceId,
        stripeDashboardUrl,
        stripeInvoiceUrl,
        dateDue,
      }),
    })
    if (response.ok) {
      await loadInvoiceLineItems(data.supabase)
      clearLineItemFields()
    } else {
      const errorData = await response.json()
      alert(`Failed to edit invoice: ${errorData.message}`)
    }
    loading = false
    showEditInvoiceModal = false
  }
</script>

<Loading {loading} />
<div class="mt-4 flex justify-center px-2 sm:px-4 md:mt-10">
  <div class="w-full max-w-7xl rounded-lg bg-base-100 p-2 shadow-xl sm:p-4">
    <h1 class="text-center text-2xl font-bold sm:text-3xl">
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
    <div class="mb-3 mt-2 flex justify-center sm:mb-5">
      <div class="flex w-full max-w-xs flex-col items-center">
        <label class="label text-center font-semibold" for="selectedBillingMonthAndYear">
          Select Billing Month And Year
        </label>
        <select
          class="select select-bordered mt-2 w-full bg-base-200"
          bind:value={selectedBillingMonthAndYear}
        >
          {#each billingMonthsAndYears as monthAndYear}
            <option value={monthAndYear}>{monthAndYear}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Revenue summary - Responsive table/cards -->
    <div class="flex justify-center">
      <div class="w-full max-w-3xl overflow-x-auto">
        <table class="table-compact table w-full shadow-xl">
          <thead>
            <tr>
              <th class="text-sm sm:text-base">Billed Revenue</th>
              <th class="text-sm sm:text-base">Collected Revenue</th>
              <th class="text-sm sm:text-base">Accounts Receivable</th>
              <th class="text-sm sm:text-base">Percent Collected</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-sm sm:text-base"
                >{formatDollarValue(revenueBilledForSelectedMonth)}</td
              >
              <td class="text-sm sm:text-base"
                >{formatDollarValue(collectedRevenueForSelectedMonth)}</td
              >
              <td class="text-sm sm:text-base"
                >{formatDollarValue(accountsReceivableForSelectedMonth)}</td
              >
              <td class="text-sm sm:text-base">{percentCollectedForSelectedMonth}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile revenue summary cards -->
    <div class="mt-4 grid grid-cols-2 gap-2 sm:hidden">
      <div class="stat rounded-lg bg-base-200 p-2 shadow-sm">
        <div class="stat-title text-xs">Billed Revenue</div>
        <div class="stat-value text-sm sm:text-lg">
          {formatDollarValue(revenueBilledForSelectedMonth)}
        </div>
      </div>
      <div class="stat rounded-lg bg-base-200 p-2 shadow-sm">
        <div class="stat-title text-xs">Collected Revenue</div>
        <div class="stat-value text-sm sm:text-lg">
          {formatDollarValue(collectedRevenueForSelectedMonth)}
        </div>
      </div>
      <div class="stat rounded-lg bg-base-200 p-2 shadow-sm">
        <div class="stat-title text-xs">Accounts Receivable</div>
        <div class="stat-value text-sm sm:text-lg">
          {formatDollarValue(accountsReceivableForSelectedMonth)}
        </div>
      </div>
      <div class="stat rounded-lg bg-base-200 p-2 shadow-sm">
        <div class="stat-title text-xs">Percent Collected</div>
        <div class="stat-value text-sm sm:text-lg">{percentCollectedForSelectedMonth}%</div>
      </div>
    </div>

    <div class="mt-4 flex justify-center">
      <div class="btn-group">
        <button
          on:click={() => (displaySetting = 'invoices')}
          class:btn-active={displaySetting === 'invoices'}
          class="btn btn-sm sm:btn-md">Invoices</button
        >
        <button
          on:click={() => (displaySetting = 'line items')}
          class:btn-active={displaySetting === 'line items'}
          class="btn btn-sm sm:btn-md">Line Items</button
        >
      </div>
    </div>

    {#if displaySetting === 'line items'}
      <!-- Line items table for medium screens and up -->
      <div class="mt-5 hidden overflow-x-auto md:block">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              <th>Billing Month</th>
              <th>Company Name</th>
              <th>Services Provided</th>
              <th>Billing Terms</th>
              <th>Cost</th>
              <th>Stripe Invoice</th>
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
                <td>
                  <div class="flex flex-col gap-1">
                    <a
                      class="link-primary text-sm font-semibold underline"
                      href={lineItem.stripe_dashboard_url}
                      target="_blank">Dashboard</a
                    >
                    <a
                      class="link-primary text-sm font-semibold underline"
                      href={lineItem.stripe_invoice_url}
                      target="_blank">Invoice</a
                    >
                  </div>
                </td>
                <td>
                  <button
                    on:click={() => updatePaymentStatus(lineItem.payment_status, lineItem.id)}
                    class="btn btn-sm"
                    class:btn-accent={lineItem.payment_status === 'Paid'}
                    class:btn-error={lineItem.payment_status === 'Unpaid'}
                    >{lineItem.payment_status}</button
                  >
                </td>
                <td>
                  <div class="flex gap-1">
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
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Line items cards for small screens -->
      <div class="mt-4 grid grid-cols-1 gap-4 md:hidden">
        {#each invoiceLineItemsForSelectedMonthAlphabetized as lineItem}
          <div class="card bg-base-200 shadow-md">
            <div class="card-body p-4">
              <div class="flex items-start justify-between">
                <h3 class="text-md font-bold">{lineItem.company_name}</h3>
                <button
                  on:click={() => updatePaymentStatus(lineItem.payment_status, lineItem.id)}
                  class="btn btn-xs"
                  class:btn-accent={lineItem.payment_status === 'Paid'}
                  class:btn-error={lineItem.payment_status === 'Unpaid'}
                  >{lineItem.payment_status}</button
                >
              </div>

              <div class="mt-1 text-sm">
                <p><span class="font-semibold">Service:</span> {lineItem.line_item_name}</p>
                <p><span class="font-semibold">Billing Month:</span> {lineItem.billing_month}</p>
                <p><span class="font-semibold">Terms:</span> {lineItem.line_item_billing_terms}</p>
                <p>
                  <span class="font-semibold">Cost:</span>
                  {formatDollarValue(lineItem.line_item_cost)}
                </p>
              </div>

              <div class="mt-2 flex gap-2 text-sm">
                <a
                  class="link-primary font-semibold underline"
                  href={lineItem.stripe_dashboard_url}
                  target="_blank">Dashboard</a
                >
                <a
                  class="link-primary font-semibold underline"
                  href={lineItem.stripe_invoice_url}
                  target="_blank">Invoice</a
                >
              </div>

              <div class="mt-3 flex justify-end gap-2">
                <button
                  on:click={() => {
                    clearLineItemFields()
                    setLineItemFields(lineItem)
                    lineItemToEdit = lineItem
                    showEditLineItemModal = true
                  }}
                  class="btn btn-info btn-xs">Edit</button
                >
                <button
                  on:click={() => {
                    showDeleteLineItemModal = true
                    lineItemToDelete = lineItem
                  }}
                  class="btn btn-error btn-xs">Delete</button
                >
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    {#if displaySetting === 'invoices'}
      <!-- Invoices table for medium screens and up -->
      <div class="mt-5 hidden overflow-x-auto md:block">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Billing Month</th>
              <th>Company Name</th>
              <th>Invoice Total</th>
              <th>Stripe Links</th>
              <th>Payment Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each invoicesForSelectedMonth as invoice}
              <tr class:!bg-red-100={isInvoicePastDue(invoice)}>
                <td>{invoice.billing_month}</td>
                <td>{invoice.company_name}</td>
                <td>{formatDollarValue(invoice.invoice_total)}</td>
                <td>
                  <div class="flex flex-col gap-1">
                    <a
                      class="link-primary text-sm font-semibold underline"
                      href={invoice.stripe_dashboard_url}
                      target="_blank">Dashboard</a
                    >
                    <a
                      class="link-primary text-sm font-semibold underline"
                      href={invoice.stripe_invoice_url}
                      target="_blank">Invoice</a
                    >
                  </div>
                </td>
                <td>
                  <div class="flex items-center justify-center gap-2">
                    <button
                      on:click={async () =>
                        await updateInvoicePaymentStatus(
                          invoice.is_paid ? 'Paid' : 'Unpaid',
                          invoice,
                        )}
                      class="btn btn-sm"
                      class:btn-accent={invoice.is_paid}
                      class:btn-error={!invoice.is_paid}
                    >
                      {invoice.is_paid ? 'Paid' : 'Unpaid'}
                    </button>
                    {#if isInvoicePastDue(invoice)}
                      <span
                        class="badge badge-error whitespace-nowrap px-2 py-1 text-center leading-none"
                      >
                        Past Due
                      </span>
                    {/if}
                  </div>
                </td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <button
                      on:click={() => {
                        showEditInvoiceModal = !showEditInvoiceModal
                        setInvoiceFields(invoice)
                      }}
                      class="btn btn-info btn-xs">Edit</button
                    >
                    <button
                      on:click={() => {
                        invoiceToDisplayLineItems = invoice
                        showInvoiceLineItemsModal = true
                      }}
                      class="btn btn-xs">Line Items</button
                    >
                    <button
                      on:click={() => sendToCollections(invoice.user_id, invoice.client_id)}
                      class="btn btn-warning btn-xs">Collections</button
                    >
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Invoices cards for small screens -->
      <div class="mt-4 grid grid-cols-1 gap-4 md:hidden">
        {#each invoicesForSelectedMonth as invoice}
          <div
            class="card bg-base-200 shadow-md"
            class:border-l-4={isInvoicePastDue(invoice)}
            class:border-error={isInvoicePastDue(invoice)}
          >
            <div class="card-body p-4">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="text-md font-bold">{invoice.company_name}</h3>
                  <p class="text-sm">{invoice.billing_month}</p>
                </div>
                <div class="flex flex-col items-end">
                  <div class="text-md font-bold">{formatDollarValue(invoice.invoice_total)}</div>
                  <div class="mt-1 flex items-center gap-1">
                    <button
                      on:click={async () =>
                        await updateInvoicePaymentStatus(
                          invoice.is_paid ? 'Paid' : 'Unpaid',
                          invoice,
                        )}
                      class="btn btn-xs"
                      class:btn-accent={invoice.is_paid}
                      class:btn-error={!invoice.is_paid}
                    >
                      {invoice.is_paid ? 'Paid' : 'Unpaid'}
                    </button>
                    {#if isInvoicePastDue(invoice)}
                      <span class="badge badge-error badge-sm">Past Due</span>
                    {/if}
                  </div>
                </div>
              </div>

              <div class="mt-2 flex gap-2 text-sm">
                <a
                  class="link-primary font-semibold underline"
                  href={invoice.stripe_dashboard_url}
                  target="_blank">Dashboard</a
                >
                <a
                  class="link-primary font-semibold underline"
                  href={invoice.stripe_invoice_url}
                  target="_blank">Invoice</a
                >
              </div>

              <div class="mt-3 flex justify-end gap-2">
                <button
                  on:click={() => {
                    showEditInvoiceModal = !showEditInvoiceModal
                    setInvoiceFields(invoice)
                  }}
                  class="btn btn-info btn-xs">Edit</button
                >
                <button
                  on:click={() => {
                    invoiceToDisplayLineItems = invoice
                    showInvoiceLineItemsModal = true
                  }}
                  class="btn btn-xs">Line Items</button
                >
                <button
                  on:click={() => sendToCollections(invoice.user_id, invoice.client_id)}
                  class="btn btn-warning btn-xs">Collections</button
                >
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- DELETE LINE ITEM MODAL BEGINS -->
<div class={`modal ${showDeleteLineItemModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative mx-auto w-11/12 max-w-xl">
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
<!-- DELETE LINE ITEM MODAL ENDS -->

<!-- EDIT LINE ITEM MODAL BEGINS -->
<div class={`modal ${showEditLineItemModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative mx-auto w-11/12 max-w-xl">
    <button
      on:click={() => (showEditLineItemModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Edit Line Item</h1>
    <form on:submit|preventDefault={editLineItem} class="max-h-[70vh] overflow-y-auto">
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

      <!-- Date Due -->
      <div class="form-control mb-4">
        <label class="label" for="stripeInvoiceUrl">Date Due</label>
        <input
          class="input input-bordered bg-base-200"
          type="date"
          id="dateDue"
          bind:value={dateDue}
          placeholder="Date Payment Is Due"
        />
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
  <div class="modal-box relative mx-auto w-11/12 max-w-xl">
    <button
      on:click={() => (addLineItemModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Add Line Item</h1>
    <form on:submit|preventDefault={addLineItem} class="max-h-[70vh] overflow-y-auto">
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

      <!-- Date Due -->
      <div class="form-control mb-4">
        <label class="label" for="stripeInvoiceUrl">Date Due</label>
        <input
          class="input input-bordered bg-base-200"
          type="date"
          id="dateDue"
          bind:value={dateDue}
          placeholder="Date Payment Is Due"
        />
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
  <div class="modal-box relative mx-auto w-11/12 max-w-xl bg-base-100">
    <button
      on:click={() => (showInvoiceLineItemsModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mt-2 text-center text-lg font-bold">
      {invoiceToDisplayLineItems?.company_name} - Line Items
    </h1>
    <div class="mt-5 overflow-x-auto">
      <table class="table table-zebra w-full bg-base-100 shadow-lg">
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

<!-- EDIT INVOICE MODAL BEGINS -->
<div class={`modal ${showEditInvoiceModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative mx-auto w-11/12 max-w-xl">
    <button
      on:click={() => (showEditInvoiceModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">{companyName} - Edit Invoice</h1>
    <form on:submit|preventDefault={editInvoice} class="max-h-[70vh] overflow-y-auto">
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

      <!-- Date Due -->
      <div class="form-control mb-4">
        <label class="label" for="stripeInvoiceUrl">Date Due</label>
        <input
          required
          class="input input-bordered bg-base-200"
          type="date"
          id="dateDue"
          bind:value={dateDue}
          placeholder="Date Payment Is Due"
        />
      </div>

      <!-- Submit Button -->
      <div class="mt-4 flex justify-center">
        <button class="btn btn-info" type="submit">Save</button>
      </div>
    </form>
  </div>
</div>
<!-- EDIT INVOICE MODAL ENDS -->
