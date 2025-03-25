<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { fade } from 'svelte/transition'

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
    const response = await fetch('/app/api/notifications/sendCollectionEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        billingContactEmail,
        subjectLine,
        emailText,
        ccArray,
      }),
    })
    if (response.ok) {
      toggleEmailTemplate()
      goto('/app/invoices')
    } else {
      const errorData = await response.json()
      alert(`Failed to send collection email: ${errorData.message}`)
    }
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
    .join('\n\n')

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
    }, 3000)
  }

  // Execute onMount
  onMount(() => {
    billingContactEmail = invoiceLineItems[0]?.client_id
    subjectLine = `${companyName} - Unpaid balance for 3PL Services`
  })
</script>

{#if unpaidInvoiceLineItems?.length > 0}
  {#if showEmailTemplate}
    <div class="mt-4 flex justify-center px-2 sm:px-4 md:mt-10">
      <div class="w-full max-w-2xl rounded-md bg-base-100 p-4 shadow-lg sm:p-7">
        <h1 class="text-center text-xl font-semibold">{companyName} - Collections Email</h1>

        <div class="mb-4 mt-4 flex flex-wrap justify-center gap-2">
          <button
            on:click={() => changeCollectionEmail('first')}
            class="btn btn-outline btn-primary btn-xs rounded-full sm:btn-sm"
            class:btn-active={collectionEmail === 'first'}
          >
            1
          </button>
          <button
            on:click={() => changeCollectionEmail('second')}
            class="btn btn-outline btn-primary btn-xs rounded-full sm:btn-sm"
            class:btn-active={collectionEmail === 'second'}
          >
            2
          </button>
          <button
            on:click={() => changeCollectionEmail('third')}
            class="btn btn-outline btn-primary btn-xs rounded-full sm:btn-sm"
            class:btn-active={collectionEmail === 'third'}
          >
            3
          </button>
          <button
            on:click={() => changeCollectionEmail('fourth')}
            class="btn btn-outline btn-primary btn-xs rounded-full sm:btn-sm"
            class:btn-active={collectionEmail === 'fourth'}
          >
            4
          </button>
          <button
            on:click={() => changeCollectionEmail('fifth')}
            class="btn btn-outline btn-primary btn-xs rounded-full sm:btn-sm"
            class:btn-active={collectionEmail === 'fifth'}
          >
            5
          </button>
        </div>

        <form on:submit|preventDefault={sendCollectionEmail}>
          <div class="mb-4 mt-4 flex flex-col items-start sm:flex-row sm:items-center">
            <strong class="mb-1 mr-2 sm:mb-0">To:</strong>
            <div class="flex w-full">
              <input
                class="input input-sm input-bordered mr-2 w-full bg-base-200 sm:input-md"
                bind:value={billingContactEmail}
                required
              />
              <button
                type="button"
                on:click={() => (showCc = !showCc)}
                class="btn btn-outline btn-info btn-sm sm:btn-md"
              >
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>

          {#if showCc}
            <div class="mb-4 flex flex-col items-start sm:flex-row sm:items-center">
              <strong class="mb-1 mr-2 sm:mb-0">Cc:</strong>
              <input
                class="input input-sm input-bordered w-full bg-base-200 sm:input-md"
                bind:value={cc}
              />
            </div>
            <div class="mt-2 flex flex-wrap gap-2">
              {#each ccArray as email}
                <button class="btn btn-outline btn-info btn-xs rounded-full">
                  {email.email}
                </button>
              {/each}
            </div>
          {/if}

          <div class="mt-4 flex flex-col items-start sm:flex-row sm:items-center">
            <strong class="mb-1 mr-2 sm:mb-0">Subject:</strong>
            <input
              class="input input-sm input-bordered w-full bg-base-200 sm:input-md"
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

          <div class="mt-6 flex justify-center sm:mt-8 sm:justify-end">
            <button class="btn btn-primary btn-sm sm:btn-md" type="submit"
              >Send Collection Email</button
            >
          </div>
        </form>
      </div>
    </div>
  {:else}
    <!-- SHOW GREEN CHECK MARK WHEN EMAIL IS SENT -->
    <div class="mt-4 flex justify-center">
      <div transition:fade={{ duration: 500 }}>
        <img
          src="/green-check-mark.png"
          class="h-20 w-20 rounded-lg sm:h-32 sm:w-32"
          alt="green check mark"
        />
      </div>
    </div>
  {/if}

  <div class="mt-6 flex justify-center px-2 sm:px-4 md:mt-10">
    <div class="w-full max-w-3xl rounded-md bg-base-100 p-4 shadow-lg sm:p-7">
      <h1 class="text-center text-lg font-semibold sm:text-xl">
        {companyName} - All Outstanding Line Items
      </h1>

      <!-- Summary for all screens -->
      <div class="mt-4 flex justify-center">
        <div class="stats stats-vertical shadow-md sm:stats-horizontal">
          <div class="stat">
            <div class="stat-title">Line Items Outstanding</div>
            <div class="stat-value text-xl sm:text-2xl">{numberOfUnpaidLineItems}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Total Outstanding</div>
            <div class="stat-value text-xl sm:text-2xl">
              {formatDollarValue(totalOutstandingBalance)}
            </div>
          </div>
        </div>
      </div>

      <!-- Table for medium screens and up -->
      <div class="mt-6 hidden overflow-x-auto md:block">
        <table class="table table-zebra shadow-lg">
          <thead>
            <tr>
              <th>Billing Month</th>
              <th>Services Provided</th>
              <th>Cost</th>
              <th>Stripe Dashboard</th>
              <th>Invoice</th>
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
                    href={lineItem.stripe_dashboard_url}
                    target="_blank">Dashboard</a
                  ></td
                >
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

      <!-- Card layout for small screens -->
      <div class="mt-4 grid grid-cols-1 gap-4 md:hidden">
        {#each unpaidInvoiceLineItems as lineItem}
          <div class="card bg-base-200 shadow-md">
            <div class="card-body p-4">
              <h2 class="card-title text-sm">
                <span class="badge badge-primary">{lineItem?.billing_month}</span>
              </h2>
              <div class="mt-1 text-sm">
                <p><span class="font-semibold">Service:</span> {lineItem?.line_item_name}</p>
                <p class="mt-1">
                  <span class="font-semibold">Cost:</span>
                  {formatDollarValue(lineItem?.line_item_cost)}
                </p>
              </div>
              <div class="card-actions mt-2 justify-end">
                <a
                  class="btn btn-primary btn-xs"
                  href={lineItem.stripe_dashboard_url}
                  target="_blank">Dashboard</a
                >
                <a
                  class="btn btn-secondary btn-xs"
                  href={lineItem.stripe_invoice_url}
                  target="_blank">Invoice</a
                >
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

{#if unpaidInvoiceLineItems?.length === 0}
  <div class="mt-4 flex flex-col items-center px-4 md:mt-10">
    <h1 class="text-center text-xl font-semibold sm:text-3xl">
      {companyName} has no unpaid invoices!
    </h1>
    <div class="mt-4 flex justify-center">
      <a class="btn btn-primary btn-sm sm:btn-md" href="/app/invoices">Return to Invoices</a>
    </div>
  </div>
{/if}
