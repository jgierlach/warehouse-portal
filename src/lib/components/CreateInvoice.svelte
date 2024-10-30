<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'

  // Import components
  import Navbar from '$lib/components/Navbar.svelte'

  // Import utility functions
  import {
    formatDateInDateRange,
    isWithinDateRange,
    generateLineItems,
    formatDate,
    formatDollarValue,
    csvGenerator,
  } from '$lib/utils'

  // Import props
  export let supabase
  export let selectedClient

  // Import stores
  import { outboundShipments, loadOutboundShipments } from '$lib/stores/outboundShipments'
  import { selectedSection, setSelectedSection } from '$lib/stores/selectedSection'

  // Component specific variables and business logic

  // Company variables
  $: clientName = selectedClient.company_name
  $: clientId = selectedClient.username
  $: perOrderFee = selectedClient.per_order_fee
  $: perOrderUnitFee = selectedClient.per_order_unit_fee
  $: perUnitFBAPackAndPrep = selectedClient.per_unit_fba_pack_prep
  $: perUnitWFSPackAndPrep = selectedClient.per_unit_wfs_pack_prep
  $: b2bFreightPercentageMarkup = selectedClient.b2b_freight_percentage_markup

  // Field variables
  let companyName = clientName
  let billingMonthAndYear = ''
  let servicesProvided = ''
  let actualContractValue = 0
  let billingTerms = ''
  let billingContactEmail = clientId

  // Variables for email
  let subjectLine = `${companyName} - Invoice for 3PL services for work done in ${billingMonthAndYear}`

  let showCc = false

  let cc = ''

  $: ccArray =
    cc === ''
      ? []
      : cc.split(',').map((email) => {
          return { email: email.trim() }
        })

  // Edit line items
  let isEditMode = false
  let editIndex = -1

  function editLineItem(index) {
    editIndex = index
    ;({ billingMonthAndYear, companyName, servicesProvided, actualContractValue, billingTerms } =
      lineItems[index])
    isEditMode = true
  }

  function updateLineItem() {
    if (editIndex !== -1) {
      lineItems[editIndex] = {
        billingMonthAndYear,
        companyName,
        servicesProvided,
        actualContractValue,
        billingTerms,
      }
      resetForm()
      isEditMode = false
    }
  }

  function resetForm() {
    billingMonthAndYear = ''
    companyName = clientName
    servicesProvided = ''
    actualContractValue = 0
    billingTerms = ''
    editIndex = -1
  }

  // Add line items
  function addLineItem() {
    if (!isEditMode) {
      lineItems = [
        ...lineItems,
        {
          billingMonthAndYear,
          companyName,
          servicesProvided,
          actualContractValue,
          billingTerms,
        },
      ]
      resetForm()
    } else {
      updateLineItem()
    }
  }

  // Delete line item
  const deleteLineItem = (lineItem) => {
    const index = lineItems.findIndex(
      (item) =>
        item.billingMonthAndYear === lineItem.billingMonthAndYear &&
        item.servicesProvided === lineItem.servicesProvided &&
        item.actualContractValue === lineItem.actualContractValue,
    )
    if (index !== -1) {
      lineItems.splice(index, 1)
    }
    lineItems = [...lineItems]
  }

  let showInvoicePreview = true

  // Shipments filtered by client and date range
  $: clientShipments = $outboundShipments.filter((shipment) => shipment.Client_Id === clientId)
  $: clientShipmentsInDateRange = clientShipments.filter((shipment) =>
    isWithinDateRange(shipment.Date_Of_Last_Change, startDate, endDate),
  )

  $: lineItems = generateLineItems(
    clientShipmentsInDateRange,
    perOrderFee,
    perOrderUnitFee,
    perUnitFBAPackAndPrep,
    perUnitWFSPackAndPrep,
    b2bFreightPercentageMarkup,
  )

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  let startDate = formatDateInDateRange(new Date(currentYear, currentMonth, 1))
  let endDate = formatDateInDateRange(now)

  async function yearToDate() {
    const now = new Date()
    const currentYear = now.getFullYear()
    startDate = formatDateInDateRange(new Date(currentYear, 0, 1))
    endDate = formatDateInDateRange(now)
  }

  async function monthToDate() {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    startDate = formatDateInDateRange(new Date(currentYear, currentMonth, 1))
    endDate = formatDateInDateRange(now)
  }

  $: {
    console.log(lineItems)
  }

  // Execute onMount
  onMount(() => {
    loadOutboundShipments(supabase)
  })
</script>

<div class="mt-6 flex flex-col items-center">
  <div class="mb-4 flex justify-center">
    <button
      on:click={() => {
        setSelectedSection('Invoices')
      }}
      class="btn btn-primary">Return To Invoices</button
    >
  </div>
  <div class="rounded-lg bg-base-100 p-4 shadow-md">
    <h1 class="text-center text-2xl font-semibold">Select Date Range</h1>
    <div class="flex items-center space-x-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text">Start Date</span>
        </label>
        <input type="date" bind:value={startDate} class="input input-bordered" />
      </div>
      <div class="form-control">
        <label class="label">
          <span class="label-text">End Date</span>
        </label>
        <input type="date" bind:value={endDate} class="input input-bordered" />
      </div>
    </div>
    <div class="mt-5 flex items-center justify-center">
      <button on:click={yearToDate} class="btn btn-secondary btn-sm mr-3">Year To Date</button>
      <button on:click={monthToDate} class="btn btn-secondary btn-sm">Month To Date</button>
    </div>
  </div>
</div>

<div id="#top" class="card ml-6 mr-6 mt-6 bg-base-100 shadow-lg">
  <div class="flex flex-wrap">
    <div class="w-full p-4">
      <!-- <div class="flex flex-wrap">
        <div class="w-1/2 p-2">
          <label class="label">Company Name</label>
          <input class="input input-bordered w-full bg-gray-100" bind:value={companyName} />
        </div>
        <div class="w-1/2 p-2">
          <label class="label">Billing Month And Year</label>
          <input class="input input-bordered w-full bg-gray-100" bind:value={billingMonthAndYear} />
        </div>
      </div>
      <div class="flex flex-wrap">
        <div class="w-1/2 p-2">
          <label class="label">Services Provided</label>
          <input class="input input-bordered w-full bg-gray-100" bind:value={servicesProvided} />
        </div>
        <div class="w-1/2 p-2">
          <label class="label">Actual Contract Value</label>
          <input class="input input-bordered w-full bg-gray-100" bind:value={actualContractValue} />
        </div>
      </div>
      <div class="flex flex-wrap">
        <div class="w-full p-2">
          <label class="label">Billing Terms</label>
          <textarea
            class="textarea textarea-bordered h-24 w-full bg-gray-100"
            bind:value={billingTerms}
          ></textarea>
        </div>
      </div> -->

      <!-- <button on:click={addLineItem} class="btn btn-outline btn-primary mt-2">
        {#if isEditMode}Update Line Item{:else}Add Line Item{/if}
      </button> -->

      <h1 class="text-center text-2xl font-semibold">{clientName} Shipments</h1>

      <div class="mt-3 flex justify-center">
        <button
          on:click={csvGenerator(
            lineItems,
            Object.keys(lineItems[0]),
            Object.keys(lineItems[0]),
            `${clientName}-Shipment-Line-Items.csv`,
          )}
          class="btn btn-primary btn-sm">Export Line Items To CSV</button
        >
      </div>

      <div class="mt-4 flex justify-center overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              <th>Order Date</th>
              <th>Shipment Number</th>
              <th>Recipient Name</th>
              <th>PO Number</th>
              <th>Order Source</th>
              <th>Units Shipped</th>
              <th>Shipment Cost</th>
              <th>Markup</th>
              <th>Total Cost</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each lineItems as item, index}
              <tr>
                <td>{formatDate(item.orderDate)}</td>
                <td>{item.shipmentNumber}</td>
                <td>{item.recipientName}</td>
                <td>{item.poNumber}</td>
                <td>{item.orderSource}</td>
                <td>{item.unitsShipped}</td>
                <td>{formatDollarValue(item.shipmentCost)}</td>
                <td>{formatDollarValue(item.markup)}</td>
                <td>{formatDollarValue(item.totalCost)}</td>
                <td class="flex space-x-1">
                  <button class="btn btn-info btn-sm"> Edit </button>
                  <button class="btn btn-error btn-sm"> Delete </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- <div class="w-full p-4 md:w-1/3">
      <div class="mb-4 mt-3 flex items-center">
        <strong class="mr-2">To:</strong>
        <input
          class="input input-bordered mr-2 w-full bg-base-200"
          bind:value={billingContactEmail}
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
        <input class="input input-bordered w-full bg-base-200" bind:value={subjectLine} />
      </div> -->

    <!-- <div class="mt-4 flex justify-center space-x-2">
        <button
          class="btn btn-outline btn-primary"
          on:click={generateAndUploadPDF}
          disabled={isPDFGeneratingAndUploading}
        >
          Generate PDF Invoice
          {#if invoiceLink !== '' && invoiceLink !== null}
            <i class="fas fa-check ml-2 text-green-500"></i>
          {/if}
        </button>

        <button on:click={createStripeInvoice} class="btn btn-outline btn-warning">
          Generate Stripe Invoice
          {#if stripeInvoiceLink !== '' && stripeInvoiceLink !== null}
            <i class="fas fa-check ml-2 text-green-500"></i>
          {/if}
        </button>

        <button
          on:click={() => {
            showNotes = !showNotes
          }}
          class="btn btn-outline"
        >
          View Notes
        </button>

        <button
          on:click={() => {
            setInvoiceToEdit($invoiceToCreate)
            setSelectedTabValue('Edit Invoice')
          }}
          class="btn btn-outline btn-info"
        >
          Edit
        </button>
      </div> -->

    <!-- {#if showStripeCustomerIdWarning}
        <p class="mt-4 text-center text-red-500">
          <strong>WARNING:</strong> No stripe customer ID found. Stripe Invoice creation will fail.
        </p>
      {/if} -->

    <!-- {#if showInvoicePreview}  
        <center>
        </center>
      {:else}
        <div class="mt-4 flex justify-center">
          <img src="/green-check-mark.png" class="w-32" alt="green check mark" />
        </div>
      {/if}

      <div class="mt-4 flex justify-end">
        <button on:click={() => 'Eat poop'} class="btn btn-primary"> Send Invoice Email </button>
      </div>
    </div>
  </div>-->
  </div>
</div>

<style>
  .column {
    /* height: 100vh; */
    overflow-y: auto;
  }

  .content {
    padding: 1rem;
    border-left: 1px solid #dbdbdb;
  }

  textarea.textarea {
    height: calc(100% - 36px);
    resize: none;
  }

  button.button {
    margin-top: 8px;
  }
</style>
