<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'

  // Props
  export let data

  // Import components
  import Loading from '$lib/components/Loading.svelte'
  import FinancialSummary from '$lib/components/FinancialSummary.svelte'

  // Import utils
  import {
    generateBillingMonthsAndYears,
    getCurrentBillingMonthAndYear,
    formatDollarValue,
    findInvoiceLineItemsForSelectedMonth,
    alphabetizeByCompanyName,
    calculateRevenueBilledForSelectedMonth,
  } from '$lib/utils.js'

  // stores
  import { invoiceLineItems, loadInvoiceLineItems } from '$lib/stores/invoiceLineItems'
  import CreateInvoice from '$lib/components/CreateInvoice.svelte'

  $: billingMonthsAndYears = generateBillingMonthsAndYears($invoiceLineItems)

  let selectedBillingMonthAndYear = getCurrentBillingMonthAndYear()

  // Execute onMount
  onMount(async () => {
    await loadInvoiceLineItems(data.supabase)
  })

  $: invoiceLineItemsForSelectedMonth = findInvoiceLineItemsForSelectedMonth(
    $invoiceLineItems,
    selectedBillingMonthAndYear,
  )

  $: invoiceLineItemsForSelectedMonthAlphabetized = alphabetizeByCompanyName(
    invoiceLineItemsForSelectedMonth,
  )

  $: revenueBilledForSelectedMonth = calculateRevenueBilledForSelectedMonth(
    invoiceLineItemsForSelectedMonth,
  )

  $: collectedRevenueForSelectedMonth = 0

  $: accountsReceivableForSelectedMonth = 0

  $: percentCollectedForSelectedMonth = 0

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
</script>

<div class="mt-10 flex justify-center">
  <div class="mr-1- ml-10 w-full bg-base-100 p-4 shadow-xl">
    <h1 class="text-center text-3xl font-bold">
      {selectedBillingMonthAndYear} - Invoice Line Items
    </h1>
    <div class="mt-2 flex justify-center">
      <button class="btn btn-primary btn-sm flex items-center gap-2">
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
            <td>{formatDollarValue(percentCollectedForSelectedMonth)}</td>
          </tr>
        </tbody>
      </table>
    </div>

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
                  <button class="btn btn-info btn-sm">Edit</button>
                  <button class="btn btn-error btn-sm">Delete</button>
                  <!-- <button class="btn btn-warning btn-sm">Send Collection Email</button> -->
                </div></td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
