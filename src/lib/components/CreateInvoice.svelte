<script>
  // Import svelte specific functions
  import { onMount } from 'svelte'

  // Import components
  import Navbar from '$lib/components/Navbar.svelte'

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
  } from '$lib/utils'

  // Import props
  export let supabase

  // Import stores
  import { outboundShipments, loadOutboundShipments } from '$lib/stores/outboundShipments'
  import { setSelectedSection } from '$lib/stores/selectedSection'
  import { selectedClientToInvoice } from '$lib/stores/selectedClientToInvoice'

  // Component specific variables and business logic

  // Company variables
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

  // Variables for email
  let subjectLine = `${clientName} - Invoice for 3PL services for work done from ${formatDate(startDate)} to ${formatDate(endDate)}`

  let showCc = false

  let cc = ''

  $: ccArray =
    cc === ''
      ? []
      : cc.split(',').map((email) => {
          return { email: email.trim() }
        })

  function resetForm() {}

  let showInvoicePreview = true

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
    .filter((shipment) => shipment.orderSource === 'Walmart Fulfillment Services')
    .reduce((a, b) => a + b.totalCost, 0)

  $: totalCostOfCustomerShipments = shipmentLineItems
    .filter(
      (shipment) =>
        shipment.orderSource !== 'Amazon FBA' &&
        shipment.orderSource !== 'Walmart Fulfillment Services',
    )
    .reduce((a, b) => a + b.totalCost, 0)

  $: lineItems = [
    {
      servicesProvided: 'Pallet Storage',
      cost: 0,
      billingTerms: `${formatDollarValue(perPalletMonthlyStorageFee)} a month per pallet`,
    },
    {
      servicesProvided: 'Shipment Of Customer Orders',
      cost: totalCostOfCustomerShipments,
      billingTerms: `${formatDollarValue(perOrderFee)} an order + ${formatDollarValue(perOrderUnitFee)} a unit`,
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

  let lineItemsToDisplay = []

  function deleteLineItem(index) {
    lineItemsToDisplay = lineItemsToDisplay.filter((_, i) => i !== index)
  }

  $: totalPrice = lineItemsToDisplay.reduce((a, b) => a + b.cost, 0)

  let autoPay = false
  let passCardFeesOn = true

  let dateIssued = getCurrentDateFormatted()
  $: dateDue = addInvoiceTerms(dateIssued, 7)

  $: {
    console.log(shipmentLineItems)
    console.log('selectedClientToInvoice', $selectedClientToInvoice)
    console.log('Total cost of FBA', totalCostOfFBAPackAndPrep)
  }

  // Execute onMount
  onMount(() => {
    loadOutboundShipments(supabase)
    lineItemsToDisplay = lineItems
    // companyName = clientName
    // billingContactEmail = clientId
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
    <div class="w-full p-4 md:w-1/2">
      <h1 class="text-center text-2xl font-semibold">Invoice Line Items</h1>
      <table class="table table-zebra mt-2 w-full">
        <thead>
          <tr>
            <th>Service Provided</th>
            <th>Cost</th>
            <th>Billing Terms</th>
          </tr>
        </thead>
        <tbody>
          {#each lineItemsToDisplay as item, index}
            <tr>
              <td>{item.servicesProvided}</td>
              <td>{item.cost}</td>
              <td>{item.billingTerms}</td>
              <td class="flex space-x-1">
                <button class="btn btn-info btn-sm"> Edit </button>
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
        <input class="input input-bordered mr-2 w-full bg-base-200" bind:value={clientId} />
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
      </div>

      {#if showStripeCustomerIdWarning}
        <p class="mt-4 text-center text-red-500">
          <strong>WARNING:</strong> No stripe customer ID found. Stripe Invoice creation will fail.
        </p>
      {/if} -->

      {#if showInvoicePreview}
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
                                    {generateInvoiceNumber()}
                                  </p>
                                  <p>
                                    <strong>Billing Month:</strong>
                                    {'FILL THIS OUT'}
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
                                  <th>Service Provided</th>
                                  <th>Price</th>
                                  <th>Billing Terms</th>
                                </tr>
                              </thead>
                              <tbody>
                                {#each lineItemsToDisplay as lineItem}
                                  <tr>
                                    <td>{lineItem.servicesProvided}</td>
                                    <td>{formatDollarValue(lineItem.cost)}</td>
                                    <td style="white-space: pre-line;"
                                      >{`The price for ${lineItem.servicesProvided} was calculated according to the terms of ${lineItem.billingTerms}.`}
                                    </td>
                                  </tr>
                                {/each}
                                {#if passCardFeesOn}
                                  <tr>
                                    <td>Card Processing Fees</td>
                                    <td>{formatDollarValue(totalPrice * 0.034)}</td>
                                    <td
                                      >The price for card processing fees was calculated as 3.4% of
                                      the total invoice.</td
                                    >
                                  </tr>
                                {/if}
                              </tbody>
                            </table>
                            <!-- End repeat -->

                            <!-- {#if passCardFeesOn} -->
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
                            <!-- {/if} -->

                            <p style="margin-top: 20px; font-size: 25px;">
                              <strong>Total:</strong>
                              <span style="background: yellow;">
                                {passCardFeesOn
                                  ? formatDollarValue(totalPrice * 1.034)
                                  : formatDollarValue(totalPrice)}
                              </span>
                            </p>

                            <!-- PROMPT TO PAY BY CREDIT CARD BEGINS -->
                            <!-- {#if autoPay === false && stripeInvoiceLink !== null && stripeInvoiceLink !== ''} -->
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
                                    href={'stripeInvoiceLink'}
                                    target="_blank"
                                    style="display: inline-block; background-color: #00449E; color: #ffffff; padding: 10px 20px; font-weight: bold; text-decoration: none; border-radius: 5px;"
                                    >Pay By Card</a
                                  >
                                  <!-- {#if passCardFeesOn} -->
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
                                  <!-- {/if} -->
                                </td>
                              </tr>
                            </table>
                            <!-- {/if} -->
                            <!-- PROMPT TO PAY BY CREDIT CARD ENDS -->

                            <!-- BEGINNING OF ACH/WIRE SECTION -->
                            <!-- {#if autoPay === false} -->
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
                                    If paying by ACH or Wire, please use the following information:
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
                                          <strong>Address:</strong> 5505 O Street, Ste #4, Lincoln, NE
                                          68510, USA
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
                                          <strong>Bank Address:</strong> 4501 23rd Avenue S, Fargo,
                                          ND 58104<br />
                                          <strong>Routing Number:</strong>
                                          091311229<br />
                                          <strong>Account Number:</strong> 202456848094
                                        </p>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                            <!-- {/if} -->
                            <!-- END OF ACH/WIRE SECTION -->

                            <!-- {#if autoPay === false} -->
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
                                    Each month you will be automatically charged for the balance of
                                    your invoice using ACH.
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
                            <!-- {/if} -->
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
          <img src="/green-check-mark.png" class="w-32" alt="green check mark" />
        </div>
      {/if}

      <div class="mt-4 flex justify-end">
        <button on:click={() => 'Eat poop'} class="btn btn-primary"> Send Invoice Email </button>
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
          class="btn btn-primary btn-sm">Export Line Items To CSV</button
        >
      </div>

      <div class="mt-2 flex justify-center">
        <button
          on:click={csvGenerator(
            shipmentLineItemsForClientExport,
            Object.keys(shipmentLineItemsForClientExport[0]),
            Object.keys(shipmentLineItemsForClientExport[0]),
            `${clientName}-Shipment-Line-Items.csv`,
          )}
          class="btn btn-primary btn-sm">Export Line Items For Client To CSV</button
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
            {#each shipmentLineItems as item, index}
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
