<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { fade } from 'svelte/transition'

  // Import packages
  import html2canvas from 'html2canvas'
  import jsPDF from 'jspdf'

  // Import components
  import Loading from '$lib/components/Loading.svelte'

  // Import utility functions
  import {
    formatDateInDateRange,
    isWithinDateRange,
    generateShipmentLineItems,
    formatDate,
    formatDollarValue,
    csvGenerator,
    generateInvoiceNumber,
    addInvoiceTerms,
    getCurrentDateFormatted,
    formatDateInSubjectLine,
    abbreviateString,
    formatMonthForLineItem,
  } from '$lib/utils'

  // Import props
  export let supabase

  // Import stores
  import { outboundShipments, loadOutboundShipments } from '$lib/stores/outboundShipments'
  import { setSelectedSection } from '$lib/stores/selectedSection'
  import { selectedClientToInvoice } from '$lib/stores/selectedClientToInvoice'

  // Component specific variables and business logic

  // Company variables
  let userId = $selectedClientToInvoice.id
  let clientName = $selectedClientToInvoice.company_name
  let companyName = $selectedClientToInvoice.company_name
  let clientId = $selectedClientToInvoice.username
  let billingContactEmail = $selectedClientToInvoice.username
  let perOrderFee = $selectedClientToInvoice.per_order_fee
  let perOrderUnitFee = $selectedClientToInvoice.per_order_unit_fee
  let perUnitFBAPackAndPrep = $selectedClientToInvoice.per_unit_fba_pack_prep
  let perUnitWFSPackAndPrep = $selectedClientToInvoice.per_unit_wfs_pack_prep
  let b2bFreightPercentageMarkup = $selectedClientToInvoice.b2b_freight_percentage_markup
  let perPalletMonthlyStorageFee = $selectedClientToInvoice.per_pallet_monthly_storage_fee
  let stripeCustomerId = $selectedClientToInvoice.stripe_customer_id
  let passCardFeesOn = $selectedClientToInvoice.pass_on_card_fees

  // Toggling date range specific variables and functions
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  let startDate = formatDateInDateRange(new Date(currentYear, currentMonth, 1))
  let endDate = formatDateInDateRange(now)

  $: formattedMonth = formatMonthForLineItem(startDate)

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

  // Variables for email
  $: subjectLine = `${clientName} - Invoice for 3PL services for work done from ${formatDateInSubjectLine(startDate)} to ${formatDateInSubjectLine(endDate)}`

  $: billingPeriod = `For work done ${formatDateInSubjectLine(startDate)} - ${formatDateInSubjectLine(endDate)}`

  // Shipments filtered by client and date range
  $: clientShipments = $outboundShipments.filter((shipment) => shipment.Client_Id === clientId)
  $: clientShipmentsInDateRange = clientShipments.filter((shipment) =>
    isWithinDateRange(shipment.Date_Of_Last_Change, startDate, endDate),
  )

  $: shipmentLineItems = generateShipmentLineItems(
    clientShipmentsInDateRange,
    perOrderFee,
    perOrderUnitFee,
    perUnitFBAPackAndPrep,
    perUnitWFSPackAndPrep,
    b2bFreightPercentageMarkup,
  )

  $: shipmentLineItemsForClientExport = shipmentLineItems.map((shipment) => {
    return {
      orderDate: shipment.orderDate,
      shipmentNumber: shipment.shipmentNumber,
      recipientName: shipment.recipientName,
      poNumber: shipment.poNumber,
      orderSource: shipment.orderSource,
      unitsShipped: shipment.unitsShipped,
      totalCost: shipment.totalCost,
    }
  })

  $: totalCostOfFBAPackAndPrep = shipmentLineItems
    .filter((shipment) => shipment.orderSource === 'Amazon FBA')
    .reduce((a, b) => a + b.totalCost, 0)

  $: totalCostOfWFSPackAndPrep = shipmentLineItems
    .filter((shipment) => shipment.orderSource === 'Walmart Fullfillment Services')
    .reduce((a, b) => a + b.totalCost, 0)

  $: totalCostOfCustomerShipments = Number(
    shipmentLineItems
      .filter(
        (shipment) =>
          shipment.orderSource !== 'Amazon FBA' &&
          shipment.orderSource !== 'Walmart Fullfillment Services',
      )
      .reduce((a, b) => a + b.totalCost, 0)
      .toFixed(2),
  )

  $: lineItems = [
    {
      servicesProvided: 'Shipment Of Customer Orders',
      cost: totalCostOfCustomerShipments,
      billingTerms: `${formatDollarValue(perOrderFee)} an order + ${formatDollarValue(perOrderUnitFee)} a unit`,
    },
    {
      servicesProvided: 'Pallet Storage',
      cost: 0,
      billingTerms: `${formatDollarValue(perPalletMonthlyStorageFee)} a month per pallet`,
    },
    {
      servicesProvided: 'FBA Pack and Prep',
      cost: totalCostOfFBAPackAndPrep,
      billingTerms: `${formatDollarValue(perUnitFBAPackAndPrep)} a unit`,
    },
    {
      servicesProvided: 'WFS Pack and Prep',
      cost: totalCostOfWFSPackAndPrep,
      billingTerms: `${formatDollarValue(perUnitFBAPackAndPrep)} a unit`,
    },
    {
      servicesProvided: 'Pallet Out Fee',
      cost: 0,
      billingTerms: '$10 a pallet',
    },
    {
      servicesProvided: 'Receiving Fees',
      cost: 0,
      billingTerms: '$30 an hour',
    },
  ]

  // Line item fields
  let servicesProvided = ''
  let cost = 0
  let billingTerms = ''

  function deleteLineItem(index) {
    lineItems = lineItems.filter((_, i) => i !== index)
  }

  let openAddLineItemModal = false
  function addLineItem() {
    const newLineItem = { servicesProvided, cost, billingTerms }
    lineItems = [...lineItems, newLineItem]
    openAddLineItemModal = false
  }

  let openEditLineItemModal = false
  let editIndex = null
  function editLineItem(index) {
    // Update the line item in lineItems with new values
    lineItems[editIndex] = {
      servicesProvided,
      cost,
      billingTerms,
    }

    // Close the modal and reset the editIndex
    openEditLineItemModal = false
    editIndex = null
  }

  $: totalPrice = lineItems.reduce((a, b) => a + b.cost, 0)

  // Shipment line items fields
  let orderDate = ''
  let shipmentNumber = ''
  let recipientName = ''
  let poNumber = ''
  let orderSource = ''
  let unitsShipped = 0
  let shipmentCost = 0.0
  let markup = 0.0
  $: totalCost = shipmentCost + markup

  function resetShipmentLineItemFields() {
    orderDate = ''
    shipmentNumber = ''
    recipientName = ''
    poNumber = ''
    orderSource = ''
    unitsShipped = 0
    shipmentCost = 0.0
    markup = 0.0
  }

  function deleteShipmentLineItem(index) {
    shipmentLineItems = shipmentLineItems.filter((_, i) => i !== index)
  }

  let openEditShipmentLineItemModal = false
  let editShipmentIndex = null

  function assignShipmentLineItemEditFields(index) {
    const item = shipmentLineItems[index]
    orderDate = item.orderDate
    shipmentNumber = item.shipmentNumber
    recipientName = item.recipientName
    poNumber = item.poNumber
    orderSource = item.orderSource
    unitsShipped = item.unitsShipped
    shipmentCost = item.shipmentCost
    markup = item.markup
    totalCost = item.totalCost
    editShipmentIndex = index
  }

  function editShipmentLineItem() {
    if (editShipmentIndex !== null) {
      shipmentLineItems[editShipmentIndex] = {
        orderDate,
        shipmentNumber,
        recipientName,
        poNumber,
        orderSource,
        unitsShipped,
        shipmentCost,
        markup,
        totalCost,
      }
      editShipmentIndex = null
    }
    openEditShipmentLineItemModal = false
  }

  let openAddShipmentLineItemModal = false
  function addShipmentLineItem() {
    const newShipmentLineItem = {
      orderDate,
      shipmentNumber,
      recipientName,
      poNumber,
      orderSource,
      unitsShipped,
      shipmentCost,
      markup,
      totalCost,
    }
    shipmentLineItems = [...shipmentLineItems, newShipmentLineItem]
    openAddShipmentLineItemModal = false
  }

  let autoPay = false
  // let passCardFeesOn = false

  let dateIssued = getCurrentDateFormatted()
  let daysUntilDue = 7
  $: dateDue = addInvoiceTerms(dateIssued, daysUntilDue)

  let isPDFGeneratingAndUploading = false

  $: showStripeCustomerIdWarning = stripeCustomerId === null

  let loading = false

  let invoicePDFLink = ''

  // Stripe specific fields
  let stripe_invoice_id = ''
  let stripe_dashboard_url = ''
  let stripeInvoiceLink = ''

  async function createStripeInvoice() {
    loading = true
    const response = await fetch('/app/api/stripe/createInvoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stripeCustomerId,
        lineItems,
        passCardFeesOn,
        billingPeriod,
        daysUntilDue,
      }),
    })

    if (!response.ok) {
      alert('Failed to create Stripe invoice link')
      throw new Error('Failed to create invoice')
    }

    const result = await response.json()

    // Set the stripe invoice link displayed to the newly created stripe invoice url
    stripe_invoice_id = result.body.invoiceId
    stripe_dashboard_url = result.body.stripeDashboardUrl
    stripeInvoiceLink = result.body.stripeInvoiceUrl

    loading = false
  }

  let showCc = false

  let cc = ''

  $: ccArray =
    cc === ''
      ? []
      : cc.split(',').map((email) => {
          return { email: email.trim() }
        })

  let showInvoicePreview = true

  function toggleInvoicePreview() {
    showInvoicePreview = !showInvoicePreview
    setTimeout(() => {
      showInvoicePreview = !showInvoicePreview
    }, 3000)
  }

  const sendInvoiceEmail = async () => {
    // Perform checks to see if PDF and Stripe Invoice have been generated
    if (stripeInvoiceLink === '' || stripeInvoiceLink === null) {
      alert(
        "You have not generated the invoice in Stripe by clicking the 'Generate Stripe Invoice' button. Please do so before sending to the client.",
      )
      return
    }

    const container = document.getElementById('pdfContent')
    const htmlContent = container.innerHTML // Capture the inner HTML

    const response = await fetch('/app/api/notifications/sendInvoiceEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        billingContactEmail,
        subjectLine,
        emailHtml: htmlContent,
        ccArray,
        pdfURL: '',
        shipmentLineItemsForClientExport,
      }),
    })

    if (response.ok) {
      goto('/app/clients#top')
      toggleInvoicePreview()
      // If successful create invoice line items
      await createInvoiceLineItems()
    } else {
      const errorData = await response.json()
      alert(`Failed to send email: ${errorData.message}`)
    }
  }

  $: {
    console.log('stripeInvoiceLink', stripeInvoiceLink)
    console.log('selectedClientToInvoice', $selectedClientToInvoice)
  }

  async function createInvoiceLineItems() {
    // Format the invoice line items to pass on to server
    const formattedLineItems = lineItems.map((lineItem) => {
      return {
        user_id: userId,
        client_id: clientId,
        company_name: companyName,
        line_item_name: lineItem.servicesProvided,
        line_item_cost: lineItem.cost,
        line_item_billing_terms: lineItem.billingTerms,
        billing_month: formatMonthForLineItem(startDate),
        stripe_invoice_id,
        stripe_dashboard_url,
        stripe_invoice_url: stripeInvoiceLink,
        payment_status: 'Unpaid',
        date_due: dateDue,
      }
    })
    // Make server api call to create line items
    const response = await fetch('/app/api/invoices/createLineItems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formattedLineItems,
      }),
    })
    if (response.ok) {
      // Perform application navigation to invoices page
      goto('/app/invoices')
    } else {
      const errorData = await response.json()
      console.error(errorData)
      alert(`Failed to create invoice line items: ${errorData.message}`)
    }
  }

  // Execute onMount
  onMount(() => {
    loadOutboundShipments(supabase)
  })
</script>

<Loading {loading} />
<div class="mt-6 flex flex-col items-center">
  <div class="mb-4 flex justify-center">
    <button
      on:click={() => {
        setSelectedSection('Clients')
      }}
      class="btn btn-primary">View All Clients</button
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
    <div class="w-full p-4 md:w-1/2">
      <h1 class="text-center text-2xl font-semibold">Invoice Line Items</h1>
      <div class="mt-2 flex justify-center">
        <button
          on:click={() => {
            servicesProvided = ''
            cost = 0
            billingTerms = ''
            openAddLineItemModal = true
          }}
          class="btn btn-primary btn-sm">Add Line Item <i class="fas fa-plus"></i></button
        >
      </div>

      <!-- ADD LINE ITEM MODAL BEGINS -->
      <div class={`modal ${openAddLineItemModal ? 'modal-open' : ''}`}>
        <div class="modal-box relative">
          <button
            on:click={() => (openAddLineItemModal = false)}
            class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
          >
          <h1 class="mb-5 text-center text-xl font-semibold">Add Line Item</h1>
          <form on:submit={addLineItem}>
            <!-- Services Provided -->
            <div class="form-control mb-4">
              <label class="label" for="servicesProvided">Services Provided</label>
              <input
                required
                class="input input-bordered bg-base-200"
                id="servicesProvided"
                bind:value={servicesProvided}
                placeholder="Services Provided"
              />
            </div>
            <!-- Cost -->
            <div class="form-control mb-4">
              <label class="label" for="cost">Cost</label>
              <input
                type="number"
                step="0.01"
                placeholder=""
                bind:value={cost}
                class="input input-bordered bg-base-200"
              />
            </div>
            <!-- Billing Terms -->
            <div class="form-control mb-4">
              <label class="label" for="servicesProvided">Billing Terms</label>
              <input
                required
                class="input input-bordered bg-base-200"
                id="servicesProvided"
                bind:value={billingTerms}
                placeholder="Billing Terms"
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

      <!-- EDIT LINE ITEM MODAL BEGINS -->
      <div class={`modal ${openEditLineItemModal ? 'modal-open' : ''}`}>
        <div class="modal-box relative">
          <button
            on:click={() => (openEditLineItemModal = false)}
            class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
          >
          <h1 class="mb-5 text-center text-xl font-semibold">Edit Line Items</h1>
          <form on:submit={editLineItem}>
            <!-- Services Provided -->
            <div class="form-control mb-4">
              <label class="label" for="servicesProvided">Services Provided</label>
              <input
                required
                class="input input-bordered bg-base-200"
                id="servicesProvided"
                bind:value={servicesProvided}
                placeholder="Services Provided"
              />
            </div>
            <!-- Cost -->
            <div class="form-control mb-4">
              <label class="label" for="cost">Cost</label>
              <input
                type="number"
                step="0.01"
                placeholder=""
                bind:value={cost}
                class="input input-bordered bg-base-200"
              />
            </div>
            <!-- Billing Terms -->
            <div class="form-control mb-4">
              <label class="label" for="servicesProvided">Billing Terms</label>
              <input
                required
                class="input input-bordered bg-base-200"
                id="servicesProvided"
                bind:value={billingTerms}
                placeholder="Billing Terms"
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

      <table class="table table-zebra mt-2 w-full p-4 shadow-lg">
        <thead>
          <tr>
            <th>Service Provided</th>
            <th>Cost</th>
            <th>Billing Terms</th>
          </tr>
        </thead>
        <tbody>
          {#each lineItems as item, index}
            <tr>
              <td>{item.servicesProvided}</td>
              <td>{item.cost}</td>
              <td>{item.billingTerms}</td>
              <td class="flex space-x-1">
                <button
                  on:click={() => {
                    servicesProvided = item.servicesProvided
                    cost = item.cost
                    billingTerms = item.billingTerms
                    editIndex = index
                    openEditLineItemModal = true
                  }}
                  class="btn btn-info btn-sm"
                >
                  Edit
                </button>
                <button on:click={() => deleteLineItem(index)} class="btn btn-error btn-sm"
                  >Delete</button
                >
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="w-full p-4 md:w-1/2">
      <div class="mb-4 mt-1 flex items-center">
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
      </div>

      {#if showInvoicePreview}
        <!-- BUTTONS SECTION BEGINS -->
        <div class="mt-4 flex justify-center space-x-2">
          <!-- <button
            class="btn btn-primary btn-sm"
            on:click={generateAndUploadPDF}
            disabled={isPDFGeneratingAndUploading}
          >
            Generate PDF Invoice Attachment
            {#if invoicePDFLink !== '' && invoicePDFLink !== null}
              <i class="fas fa-check ml-2 text-green-500"></i>
            {/if}
          </button> -->
          <button on:click={createStripeInvoice} class="btn btn-warning btn-sm">
            Generate Stripe Invoice Link
            {#if stripeInvoiceLink !== '' && stripeInvoiceLink !== null}
              <i class="fas fa-check ml-2 text-green-500"></i>
            {/if}
          </button>
        </div>

        {#if showStripeCustomerIdWarning}
          <p class="mt-4 text-center text-red-500">
            <strong>WARNING:</strong> No stripe customer ID found. Stripe Invoice creation will fail.
          </p>
        {/if}
        <!-- BUTTONS SECTION ENDS -->

        <!-- INVOICE LINKS TABLE BEGINS -->
        {#if stripeInvoiceLink !== '' && stripeInvoiceLink !== null}
          <div class="mt-3 flex justify-center">
            <table class="table w-full bg-base-100 p-4 shadow-lg">
              <tbody>
                <!-- <tr>
              <td><strong>Invoice PDF</strong></td>
              <td
                ><a href={invoicePDFLink} class="link link-primary" target="_blank"
                  >{abbreviateString(invoicePDFLink, 35)}</a
                ></td
              >
            </tr> -->
                <tr>
                  <td><strong>Stripe Invoice Link</strong></td>
                  <td
                    ><a href={stripeInvoiceLink} class="link link-primary" target="_blank"
                      >{abbreviateString(stripeInvoiceLink, 45)}</a
                    ></td
                  >
                </tr>
              </tbody>
            </table>
          </div>
        {/if}
        <!-- INVOICE LINKS TABLE ENDS -->

        <!-- INVOICE CONTROLS BEGINS -->
        <div class="mt-2 flex justify-center space-x-2">
          <div class="form-control">
            <label class="label" for="daysUntilDue"><strong>Days Until Due</strong></label>
            <input
              type="number"
              step="1.0"
              class="input input-bordered bg-base-200"
              id="daysUntilDue"
              bind:value={daysUntilDue}
              placeholder="Days Until Due"
            />
          </div>
          <div class="form-control">
            <label class="label" for="autoPay"><strong>Auto Pay</strong></label>
            <select class="select select-bordered bg-base-200" bind:value={autoPay}>
              <option value={true}>TRUE</option>
              <option value={false}>FALSE</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label" for="passCardFeesOn"><strong>Pass Card Fees On</strong></label>
            <select class="select select-bordered bg-base-200" bind:value={passCardFeesOn}>
              <option value={true}>TRUE</option>
              <option value={false}>FALSE</option>
            </select>
          </div>
        </div>
        <!-- INVOICE CONTROLS ENDS -->

        <center>
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center" style="text-align: center;">
                <table
                  id="pdfContent"
                  width="100%"
                  border="0"
                  cellspacing="0"
                  cellpadding="0"
                  style="margin-top: 16px; background-color: #fafafa"
                >
                  <tr>
                    <td align="center">
                      <table
                        width="600"
                        border="0"
                        cellspacing="0"
                        cellpadding="0"
                        style="border-collapse: collapse;"
                      >
                        <tr>
                          <td style="padding: 20px; background-color: #fafafa;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="font-weight: bold;">Sender:</td>
                                <td align="right" style="font-size: 18px; font-weight: bold;"
                                  >{autoPay ? 'RECEIPT' : 'INVOICE'}</td
                                >
                              </tr>
                              <tr>
                                <td colspan="2" style="padding-top: 10px;">
                                  <address>
                                    Numble LLC (dba Hometown Industries)<br />
                                    5505 O Street<br />
                                    Lincoln, NE, 68510<br />
                                    Phone: +1 (402) 413-8754<br />
                                    Email: accountsreceivables@hometown-industries.com
                                  </address>
                                </td>
                              </tr>
                              <tr>
                                <td colspan="2" style="padding-top: 10px;">
                                  <strong>Bill To:</strong>
                                  <address>
                                    {companyName}<br />
                                    Email: {billingContactEmail}
                                  </address>
                                </td>
                              </tr>
                              <tr>
                                <td align="right" colspan="2">
                                  <p>
                                    <strong>Invoice #:</strong>
                                    <!-- {`3PL${generateInvoiceNumber()}`} -->
                                    {stripe_invoice_id}
                                  </p>
                                  <p>
                                    <strong>Billing Period:</strong>
                                    {`${formatDateInSubjectLine(startDate)} - ${formatDateInSubjectLine(endDate)}`}
                                  </p>
                                  <p>
                                    <strong>Date Issued:</strong>
                                    {dateIssued}
                                  </p>
                                  <p>
                                    <strong>Date Due:</strong>
                                    <span style="background: yellow;"
                                      >{autoPay ? dateIssued : dateDue}</span
                                    >
                                  </p>
                                </td>
                              </tr>
                            </table>
                            <!-- Repeat for each line item -->
                            <table
                              width="100%"
                              border="1"
                              cellspacing="0"
                              cellpadding="5"
                              style="margin-top: 20px; border-collapse: collapse; background: #ffffff; border: none;"
                            >
                              <thead>
                                <tr>
                                  <th style="padding: 20px">Service Provided</th>
                                  <th style="padding: 20px">Price</th>
                                  <th style="padding: 20px">Billing Terms</th>
                                </tr>
                              </thead>
                              <tbody>
                                {#each lineItems as lineItem}
                                  <tr>
                                    <td style="padding: 20px">{lineItem.servicesProvided}</td>
                                    <td style="padding: 20px">{formatDollarValue(lineItem.cost)}</td
                                    >
                                    <td style="white-space: pre-line; padding: 20px"
                                      >{`The price for ${lineItem.servicesProvided} was calculated according to the terms of ${lineItem.billingTerms}.`}
                                    </td>
                                  </tr>
                                {/each}
                                {#if passCardFeesOn}
                                  <tr>
                                    <td style="padding: 20px">Card Processing Fees</td>
                                    <td style="padding: 20px"
                                      >{formatDollarValue(totalPrice * 0.034)}</td
                                    >
                                    <td style="padding: 20px"
                                      >The price for card processing fees was calculated as 3.4% of
                                      the total invoice.</td
                                    >
                                  </tr>
                                {/if}
                              </tbody>
                            </table>
                            <!-- End repeat -->

                            {#if passCardFeesOn}
                              <p
                                style="font-size: 16px; font-weight: bold; margin-top: 20px; color:
                              red;"
                              >
                                CARD FEES HAVE BEEN APPLIED TO YOUR INVOICE TOTAL.
                              </p>
                              <p
                                style="font-size: 16px; font-weight: bold; margin-top: 10px; color:
                            red;"
                              >
                                Contact accountsreceivables@hometown-industries.com if you'd like to
                                change your payment method on file.
                              </p>
                            {/if}

                            <p style="margin-top: 20px; font-size: 25px;">
                              <strong>Total:</strong>
                              <span style="background: yellow;">
                                {passCardFeesOn
                                  ? formatDollarValue(totalPrice * 1.034)
                                  : formatDollarValue(totalPrice)}
                              </span>
                            </p>

                            <!-- PROMPT TO PAY BY CREDIT CARD BEGINS -->
                            {#if autoPay === false && stripeInvoiceLink !== null && stripeInvoiceLink !== ''}
                              <table
                                width="100%"
                                border="0"
                                cellspacing="0"
                                cellpadding="0"
                                style="margin-top: 20px;"
                              >
                                <tr>
                                  <td style="text-align: center;">
                                    <p
                                      style="font-size: 20px; font-weight: bold; margin-bottom: 12px;"
                                    >
                                      If paying by credit card, click the button below.
                                    </p>
                                    <a
                                      href={stripeInvoiceLink}
                                      target="_blank"
                                      style="display: inline-block; background-color: #00449E; color: #ffffff; padding: 10px 20px; font-weight: bold; text-decoration: none; border-radius: 5px;"
                                      >Pay By Card</a
                                    >
                                    {#if passCardFeesOn}
                                      <p
                                        style="font-size: 16px; font-weight: bold; margin-bottom: 12px; margin-top: 12px; color: red;"
                                      >
                                        CARD FEES HAVE BEEN APPLIED TO THIS INVOICE
                                      </p>
                                      <p
                                        style="font-size: 16px; font-weight: bold; margin-bottom: 12px; color: red;"
                                      >
                                        Please pay by ACH/WIRE to avoid the processing surcharge
                                      </p>
                                    {/if}
                                  </td>
                                </tr>
                              </table>
                            {/if}
                            <!-- PROMPT TO PAY BY CREDIT CARD ENDS -->

                            <!-- BEGINNING OF ACH/WIRE SECTION -->
                            {#if autoPay === false}
                              <table
                                width="100%"
                                border="0"
                                cellspacing="0"
                                cellpadding="0"
                                style="margin-top: 20px;"
                              >
                                <tr>
                                  <td style="padding: 20px; background-color: #ffffff;">
                                    <p
                                      style="font-size: 20px; font-weight: bold; margin-top: 20px; text-align: center;"
                                    >
                                      Payment By ACH/Wire to avoid card fees
                                    </p>
                                    <p style="margin-bottom: 10px;">
                                      If paying by ACH or Wire, please use the following
                                      information:
                                    </p>

                                    <table
                                      width="100%"
                                      border="0"
                                      cellspacing="0"
                                      cellpadding="0"
                                      style="margin-top: 10px;"
                                    >
                                      <tr>
                                        <td valign="top">
                                          <p style="margin: 0; font-weight: bold; font-size: 20px;">
                                            Beneficiary Details:
                                          </p>
                                          <p style="margin: 5px 0;">
                                            <strong>Name:</strong> Numble LLC<br />
                                            <strong>Type of Account:</strong>
                                            Checking<br />
                                            <strong>Address:</strong> 5505 O Street, Ste #4, Lincoln,
                                            NE 68510, USA
                                          </p>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td valign="top">
                                          <p style="margin: 0; font-weight: bold; font-size: 20px;">
                                            Receiving Bank Details
                                          </p>
                                          <p style="margin: 5px 0;">
                                            <strong>Bank Name:</strong> Choice Financial Group<br />
                                            <strong>Bank Address:</strong> 4501 23rd Avenue S,
                                            Fargo, ND, 58104<br />
                                            <strong>Routing Number:</strong>
                                            091311229<br />
                                            <strong>Account Number:</strong> 202486516073
                                          </p>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </table>
                            {/if}
                            <!-- END OF ACH/WIRE SECTION -->

                            {#if autoPay === false}
                              <!-- BEGINNING OF ENROLL IN AUTOMATIC ACH PAYMENTS -->
                              <table
                                width="100%"
                                border="0"
                                cellspacing="0"
                                cellpadding="0"
                                style="margin-top: 20px;"
                              >
                                <tr>
                                  <td style="padding: 20px; background-color: #ffffff;">
                                    <p
                                      style="font-size: 20px; font-weight: bold; margin-top: 20px; text-align: center;"
                                    >
                                      Enroll In Automatic ACH Billing
                                    </p>
                                    <p style="margin-bottom: 15px;">
                                      Each month you will be automatically charged for the balance
                                      of your invoice using ACH.
                                      <!-- {#if passCardFeesOn} -->
                                      By enrolling in ACH billing you will pay no card fees.
                                      <!-- {/if} -->
                                    </p>

                                    <div style="text-align: center;">
                                      <a
                                        href="https://billing.stripe.com/p/login/aEU170e8zgEM6nCaEE"
                                        target="_blank"
                                        style="display: inline-block; background-color: #00449E; color: #ffffff; padding: 10px 20px; font-weight: bold; text-decoration: none; border-radius: 5px;"
                                        >Enroll In Automatic ACH Billing</a
                                      >
                                    </div>

                                    <p style="text-align: center; margin-top: 10px;">
                                      <strong
                                        >** Log in using email: {billingContactEmail}
                                        **</strong
                                      >
                                    </p>
                                  </td>
                                </tr>
                              </table>
                              <!-- END OF ENROLL IN AUTOMATIC ACH PAYMENTS -->
                            {/if}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </center>
      {:else}
        <div class="mt-4 flex justify-center">
          <div transition:fade={{ duration: 500 }}>
            <img src="/green-check-mark.png" class="w-32" alt="green check mark" />
          </div>
        </div>
      {/if}

      <div class="mt-4 flex justify-end">
        <button on:click={sendInvoiceEmail} class="btn btn-primary"> Send Invoice Email </button>
      </div>
    </div>
  </div>
</div>

<div class="card ml-6 mr-6 mt-6 bg-base-100 shadow-lg">
  <div class="flex flex-wrap">
    <div class="w-full p-4">
      <h1 class="text-center text-2xl font-semibold">{clientName} Shipments</h1>
      <div class="mt-3 flex justify-center">
        <button
          on:click={csvGenerator(
            shipmentLineItems,
            Object.keys(shipmentLineItems[0]),
            Object.keys(shipmentLineItems[0]),
            `${clientName}-Shipment-Line-Items.csv`,
          )}
          class="btn btn-outline btn-sm mr-2">Export Line Items To CSV</button
        >
        <button
          on:click={csvGenerator(
            shipmentLineItemsForClientExport,
            Object.keys(shipmentLineItemsForClientExport[0]),
            Object.keys(shipmentLineItemsForClientExport[0]),
            `${clientName}-Shipment-Line-Items.csv`,
          )}
          class="btn btn-outline btn-sm">Export Line Items For Client To CSV</button
        >
      </div>

      <div class="mb-4 mt-2 flex justify-center">
        <button
          on:click={() => {
            resetShipmentLineItemFields()
            openAddShipmentLineItemModal = true
          }}
          class="btn btn-primary btn-sm"
          >Add Shipment Line Item <i class="fas fa-plus"></i>
        </button>
      </div>

      <div class="mt-4 flex justify-center overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              <th>Order Date</th>
              <th>Shipment Number</th>
              <th>Recipient Name</th>
              <th>Order Source</th>
              <th>Units Shipped</th>
              <th>Shipment Cost</th>
              <th>Markup</th>
              <th>Total Cost</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each shipmentLineItems as item, index}
              <tr>
                <td>{formatDate(item.orderDate)}</td>
                <td>{item.shipmentNumber}</td>
                <td>{item.recipientName}</td>
                <td>{item.orderSource}</td>
                <td>{item.unitsShipped}</td>
                <td>{formatDollarValue(item.shipmentCost)}</td>
                <td>{formatDollarValue(item.markup)}</td>
                <td>{formatDollarValue(item.totalCost)}</td>
                <td class="flex space-x-1">
                  <button
                    on:click={() => {
                      assignShipmentLineItemEditFields(index)
                      openEditShipmentLineItemModal = true
                    }}
                    class="btn btn-info btn-sm">Edit</button
                  >
                  <button
                    on:click={() => deleteShipmentLineItem(index)}
                    class="btn btn-error btn-sm">Delete</button
                  >
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- ADD SHIPMENT Line ITEM MODAL BEGINS -->
<div class={`modal ${openAddShipmentLineItemModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (openAddShipmentLineItemModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Add Shipment Line Item</h1>
    <form on:submit={addShipmentLineItem}>
      <!-- Order Date -->
      <div class="form-control mb-4">
        <label class="label" for="servicesProvided">Order Date</label>
        <input
          required
          class="input input-bordered bg-base-200"
          id="orderDate"
          bind:value={orderDate}
          placeholder="MM/DD/YYYY"
        />
      </div>
      <!-- Shipment Number -->
      <div class="form-control mb-4">
        <label class="label" for="shipmentNumber">Shipment Number</label>
        <input
          type="text"
          placeholder="Shipment Number"
          bind:value={shipmentNumber}
          class="input input-bordered bg-base-200"
        />
      </div>
      <!-- Recipient Name -->
      <div class="form-control mb-4">
        <label class="label" for="recipientName">Recipient Name</label>
        <input
          class="input input-bordered bg-base-200"
          id="recipientName"
          bind:value={recipientName}
          placeholder="Recipient Name"
        />
      </div>
      <!-- PO Number -->
      <div class="form-control mb-4">
        <label class="label" for="poNumber">PO Number</label>
        <input
          class="input input-bordered bg-base-200"
          id="poNumber"
          bind:value={poNumber}
          placeholder="PO Number"
        />
      </div>
      <!-- Order Source -->
      <div class="form-control mb-4">
        <label class="label" for="orderSource">Order Source</label>
        <input
          class="input input-bordered bg-base-200"
          id="orderSource"
          bind:value={orderSource}
          placeholder="Order Source"
        />
      </div>
      <!-- Units Shipped -->
      <div class="form-control mb-4">
        <label class="label" for="unitsShipped">Units Shipped</label>
        <input
          type="number"
          step="1.0"
          class="input input-bordered bg-base-200"
          id="unitsShipped"
          bind:value={unitsShipped}
          placeholder="Units Shipped"
        />
      </div>
      <!-- Shipment Cost -->
      <div class="form-control mb-4">
        <label class="label" for="shipmentCost">Shipment Cost</label>
        <input
          id="shipmentCost"
          type="number"
          step="0.01"
          placeholder="Shipment Cost"
          bind:value={shipmentCost}
          class="input input-bordered bg-base-200"
        />
      </div>
      <!-- Mark Up -->
      <div class="form-control mb-4">
        <label class="label" for="markup">Markup</label>
        <input
          id="markup"
          type="number"
          step="0.01"
          placeholder="Mark Up"
          bind:value={markup}
          class="input input-bordered bg-base-200"
        />
      </div>
      <!-- Total Cost -->
      <div class="form-control mb-4">
        <label class="label" for="totalCost">Total Cost</label>
        <h1 class="">{totalCost}</h1>
      </div>
      <!-- Submit Button -->
      <div class="mt-4 flex justify-center">
        <button class="btn btn-info" type="submit">Submit</button>
      </div>
    </form>
  </div>
</div>

<!-- ADD SHIPMENT LINE ITEM MODAL ENDS -->

<!-- EDIT SHIPMENT LINE ITEM MODAL BEGINS -->
<div class={`modal ${openEditShipmentLineItemModal ? 'modal-open' : ''}`}>
  <div class="modal-box relative">
    <button
      on:click={() => (openEditShipmentLineItemModal = false)}
      class="btn btn-circle btn-sm absolute right-2 top-2">✕</button
    >
    <h1 class="mb-5 text-center text-xl font-semibold">Edit Shipment Line Item</h1>
    <form on:submit={editShipmentLineItem}>
      <!-- Order Date -->
      <div class="form-control mb-4">
        <label class="label" for="servicesProvided">Order Date</label>
        <input
          required
          class="input input-bordered bg-base-200"
          id="orderDate"
          bind:value={orderDate}
          placeholder="MM/DD/YYYY"
        />
      </div>
      <!-- Shipment Number -->
      <div class="form-control mb-4">
        <label class="label" for="shipmentNumber">Shipment Number</label>
        <input
          type="text"
          placeholder="Shipment Number"
          bind:value={shipmentNumber}
          class="input input-bordered bg-base-200"
        />
      </div>
      <!-- Recipient Name -->
      <div class="form-control mb-4">
        <label class="label" for="recipientName">Recipient Name</label>
        <input
          class="input input-bordered bg-base-200"
          id="recipientName"
          bind:value={recipientName}
          placeholder="Recipient Name"
        />
      </div>
      <!-- PO Number -->
      <div class="form-control mb-4">
        <label class="label" for="poNumber">PO Number</label>
        <input
          class="input input-bordered bg-base-200"
          id="poNumber"
          bind:value={poNumber}
          placeholder="PO Number"
        />
      </div>
      <!-- Order Source -->
      <div class="form-control mb-4">
        <label class="label" for="orderSource">Order Source</label>
        <input
          class="input input-bordered bg-base-200"
          id="orderSource"
          bind:value={orderSource}
          placeholder="Order Source"
        />
      </div>
      <!-- Units Shipped -->
      <div class="form-control mb-4">
        <label class="label" for="unitsShipped">Units Shipped</label>
        <input
          type="number"
          step="1.0"
          class="input input-bordered bg-base-200"
          id="unitsShipped"
          bind:value={unitsShipped}
          placeholder="Units Shipped"
        />
      </div>
      <!-- Shipment Cost -->
      <div class="form-control mb-4">
        <label class="label" for="shipmentCost">Shipment Cost</label>
        <input
          id="shipmentCost"
          type="number"
          step="0.01"
          placeholder="Shipment Cost"
          bind:value={shipmentCost}
          class="input input-bordered bg-base-200"
        />
      </div>
      <!-- Mark Up -->
      <div class="form-control mb-4">
        <label class="label" for="markup">Markup</label>
        <input
          id="markup"
          type="number"
          step="0.01"
          placeholder="Mark Up"
          bind:value={markup}
          class="input input-bordered bg-base-200"
        />
      </div>
      <!-- Total Cost -->
      <div class="form-control mb-4">
        <label class="label" for="totalCost">Total Cost</label>
        <h1 class="">{totalCost}</h1>
      </div>
      <!-- Submit Button -->
      <div class="mt-4 flex justify-center">
        <button class="btn btn-info" type="submit">Save</button>
      </div>
    </form>
  </div>
</div>

<!-- EDIT SHIPMENT LINE ITEM MODAL ENDS -->

<style>
  .column {
    /* height: 100vh; */
    overflow-y: auto;
  }

  .content {
    padding: 1rem;
    border-left: 1px solid #dbdbdb;
  }
</style>
