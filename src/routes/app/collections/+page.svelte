<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'

  // Import utils
  import { formatDollarValue, abbreviateString } from '$lib/utils.js'

  export let data

  $: invoiceLineItems = data?.invoiceLineItems

  $: numberOfUnpaidLineItems = invoiceLineItems?.length

  $: totalOutstandingBalance = invoiceLineItems.reduce(
    (total, item) => total + (item.line_item_cost || 0),
    0,
  )

  $: companyName = invoiceLineItems[0]?.company_name

  let billingContactEmail = ''
  let subjectLine = ''
  let collectionMessage = ''

  let showCc = false
  let cc = ''
  $: ccArray =
    cc === ''
      ? []
      : cc.split(',').map((email) => {
          return { email: email.trim() }
        })

  async function sendCollectionEmail() {
    // Send collection email
  }

  // Execute onMount
  onMount(() => {
    billingContactEmail = invoiceLineItems[0]?.client_id
    subjectLine = `${companyName} - Unpaid balance for 3PL Services`
  })
</script>

<div class="mt-10 flex justify-center">
  <div class="w-full max-w-2xl rounded-md bg-base-100 p-7 shadow-lg">
    <h1 class="text-center text-xl font-semibold">{companyName} - Collections Email</h1>

    <form on:submit|preventDefault={sendCollectionEmail}>
      <div class="mb-4 mt-4 flex items-center">
        <strong class="mr-2">To:</strong>
        <input
          class="input input-bordered mr-2 w-full bg-base-200"
          bind:value={billingContactEmail}
          required
        />
        <button on:click={() => (showCc = !showCc)} class="btn btn-outline btn-info">
          <i class="fas fa-plus"></i>
        </button>
      </div>

      {#if showCc}
        <div class="mb-4 flex items-center">
          <strong class="mr-2">Cc:</strong>
          <input class="input input-bordered w-full bg-base-200" bind:value={cc} />
        </div>
        <div class="mt-2 flex flex-wrap space-x-2">
          {#each ccArray as email}
            <button class="btn btn-outline btn-info btn-sm rounded-full">
              {email.email}
            </button>
          {/each}
        </div>
      {/if}

      <div class="mt-4 flex items-center">
        <strong class="mr-2">Subject:</strong>
        <input class="input input-bordered w-full bg-base-200" bind:value={subjectLine} required />
      </div>

      <div class="mt-4 flex justify-center">
        <!-- <textarea
          class="textarea textarea-bordered w-full bg-base-200"
          id="collectionMessage"
          bind:value={collectionMessage}
          placeholder="Collection Text"
          required
        ></textarea> -->
        <textarea
          class="textarea textarea-bordered min-h-48 w-full bg-base-200"
          id="collectionMessage"
          bind:value={collectionMessage}
          placeholder="Collection Text"
          required
        ></textarea>
      </div>

      <div class="mt-8 flex justify-end">
        <button class="btn btn-primary" type="submit">Send Collection Email</button>
      </div>
    </form>
  </div>
</div>

<div class="mt-10 flex justify-center">
  <div class="w-full max-w-3xl rounded-md bg-base-100 p-7 shadow-lg">
    <h1 class="text-center text-xl font-semibold">
      All Outstanding Line Items From - {companyName}
    </h1>
    <div class="mt-4 flex justify-center">
      <table class="table max-w-10 shadow-lg">
        <thead>
          <tr>
            <th>Number of Line Items Outstanding</th>
            <th>Total Outstanding Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{numberOfUnpaidLineItems}</td>
            <td>{formatDollarValue(totalOutstandingBalance)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-center">
      <table class="table table-zebra shadow-lg">
        <thead>
          <tr>
            <th>Billing Month</th>
            <th>Services Provided</th>
            <th>Cost</th>
            <th>Invoice Url</th>
          </tr>
        </thead>
        <tbody>
          {#each invoiceLineItems as lineItem}
            <tr>
              <td>{lineItem?.billing_month}</td>
              <td>{lineItem?.line_item_name}</td>
              <td>{formatDollarValue(lineItem?.line_item_cost)}</td>
              <td
                ><a
                  class="link-primary font-semibold underline"
                  href={lineItem.stripe_invoice_url}
                  target="_blank">Invoice</a
                ></td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
