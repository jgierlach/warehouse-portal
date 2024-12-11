<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'

  // Props
  export let data

  // Import utils
  import {
    generateBillingMonthsAndYears,
    getCurrentBillingMonthAndYear,
    formatDollarValue,
    abbreviateString,
  } from '$lib/utils.js'

  // stores
  import { invoiceLineItems, loadInvoiceLineItems } from '$lib/stores/invoiceLineItems'

  $: billingMonthsAndYears = generateBillingMonthsAndYears($invoiceLineItems)

  let selectedBillingMonthAndYear = getCurrentBillingMonthAndYear()

  // Execute onMount
  onMount(async () => {
    await loadInvoiceLineItems(data.supabase)
  })
</script>

<div class="mt-10 flex justify-center">
  <div class="ml-20 mr-20 w-full bg-base-100 p-4 shadow-xl">
    <h1 class="text-center text-3xl font-bold">Invoice Line Items</h1>
    <div class="mt-2 flex justify-center">
      <button class="btn btn-primary btn-sm flex items-center gap-2">
        Add Line Item
        <i class="fas fa-plus"></i>
      </button>
    </div>
    <div class="mb-5 mt-4 flex justify-center">
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

    <div class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Billing Month</th>
            <th>Company Name</th>
            <th>Services Provided</th>
            <th>Billing Terms</th>
            <th>Cost</th>
            <th>Stripe Invoice Url</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each $invoiceLineItems as lineItem}
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
              <td>
                <div class="flex space-x-1">
                  <button class="btn btn-info btn-sm">Edit</button>
                  <button class="btn btn-error btn-sm">Delete</button>
                </div></td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
