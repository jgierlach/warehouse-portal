<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'

  // Import utils
  import { formatDollarValue, abbreviateString, setCollectionEmailText } from '$lib/utils.js'

  export let data

  $: invoiceLineItems = data?.invoiceLineItems

  $: unpaidInvoiceLineItems = invoiceLineItems.filter(
    (lineItem) => lineItem?.payment_status === 'Unpaid',
  )

  $: {
    console.log('INVOICE LINE ITEMS', invoiceLineItems)
  }

  $: numberOfUnpaidLineItems = unpaidInvoiceLineItems?.length

  $: totalOutstandingBalance = unpaidInvoiceLineItems.reduce(
    (total, item) => total + (item.line_item_cost || 0),
    0,
  )

  $: companyName = invoiceLineItems[0]?.company_name

  let billingContactEmail = ''
  let subjectLine = ''

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

  let collectionEmail = 'first'

  function changeCollectionEmail(email) {
    collectionEmail = email
  }

  $: lineItemsOutstandingText = unpaidInvoiceLineItems
    .map((lineItem) => {
      return `- For work done in ${lineItem?.billing_month}, the services provided were ${lineItem?.line_item_name} and the amount due is ${formatDollarValue(lineItem?.line_item_cost)}.`
    })
    .join('\n\n')

  // $: stripeInvoiceUrls = [
  //   ...new Set(unpaidInvoiceLineItems.map((lineItem) => lineItem?.stripe_invoice_url)),
  // ].join('\n\n')

  $: stripeInvoiceUrls = Array.from(
    new Set(unpaidInvoiceLineItems.map((lineItem) => lineItem.stripe_invoice_url)),
  )
    .map((stripeInvoiceUrl) =>
      unpaidInvoiceLineItems.find((lineItem) => lineItem.stripe_invoice_url === stripeInvoiceUrl),
    )
    .map((lineItem) => `${lineItem.billing_month} - ${lineItem.stripe_invoice_url}`)

  $: emailText = setCollectionEmailText(
    collectionEmail,
    lineItemsOutstandingText,
    companyName,
    totalOutstandingBalance,
    stripeInvoiceUrls,
  )

  let showEmailTemplate = true

  function toggleEmailTemplate() {
    showEmailTemplate = !showEmailTemplate
    setTimeout(() => {
      showEmailTemplate = !showEmailTemplate
    }, 2000)
  }

  // Execute onMount
  onMount(() => {
    billingContactEmail = invoiceLineItems[0]?.client_id
    subjectLine = `${companyName} - Unpaid balance for 3PL Services`
  })
</script>

{#if unpaidInvoiceLineItems?.length > 0}
  <div class="mt-10 flex justify-center">
    <div class="w-full max-w-2xl rounded-md bg-base-100 p-7 shadow-lg">
      <h1 class="text-center text-xl font-semibold">{companyName} - Collections Email</h1>

      <div class="mb-4 mt-4 flex justify-center space-x-2">
        <button
          on:click={() => changeCollectionEmail('first')}
          class="btn btn-outline btn-primary btn-sm rounded-full"
          class:btn-active={collectionEmail === 'first'}
        >
          1
        </button>
        <button
          on:click={() => changeCollectionEmail('second')}
          class="btn btn-outline btn-primary btn-sm rounded-full"
          class:btn-active={collectionEmail === 'second'}
        >
          2
        </button>
        <button
          on:click={() => changeCollectionEmail('third')}
          class="btn btn-outline btn-primary btn-sm rounded-full"
          class:btn-active={collectionEmail === 'third'}
        >
          3
        </button>
        <button
          on:click={() => changeCollectionEmail('fourth')}
          class="btn btn-outline btn-primary btn-sm rounded-full"
          class:btn-active={collectionEmail === 'fourth'}
        >
          4
        </button>
        <button
          on:click={() => changeCollectionEmail('fifth')}
          class="btn btn-outline btn-primary btn-sm rounded-full"
          class:btn-active={collectionEmail === 'fifth'}
        >
          5
        </button>
      </div>

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
          <input
            class="input input-bordered w-full bg-base-200"
            bind:value={subjectLine}
            required
          />
        </div>

        <div class="mt-4 flex justify-center">
          <textarea
            class="textarea textarea-bordered min-h-48 w-full bg-base-200"
            id="collectionMessage"
            bind:value={emailText}
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
        {companyName} - All Outstanding Line Items
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
            {#each unpaidInvoiceLineItems as lineItem}
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
{/if}

{#if unpaidInvoiceLineItems?.length === 0}
  <h1 class="mt-10 text-center text-3xl font-semibold">{companyName} has no unpaid invoices!</h1>
  <div class="mt-4 flex justify-center">
    <a class="btn btn-primary" href="/app/invoices">Return to Invoices</a>
  </div>
{/if}
