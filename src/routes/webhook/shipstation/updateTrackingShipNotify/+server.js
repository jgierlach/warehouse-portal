import { json } from '@sveltejs/kit'

// Disable CSRF protection for this webhook route
export const config = {
  csrf: false,
}

export async function POST({ request, locals }) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*', // Allow requests from any origin
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const event = await request.json()
    console.log('Webhook received On Shipped Event:', event)

    // Check if the event contains a resource_url
    if (!event.resource_url) {
      return json(
        { error: 'Invalid webhook payload: no resource_url provided' },
        { status: 400, headers },
      )
    }

    // Fetch order data from ShipStation using the resource_url
    const response = await fetch(event.resource_url, {
      headers: {
        Authorization: `Basic ${Buffer.from(import.meta.env.VITE_SHIPSTATION_API_KEY + ':' + import.meta.env.VITE_SHIPSTATION_SECRET).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch order data:', response.status, response.statusText)
      return json({ error: 'Failed to fetch order data' }, { status: 500, headers })
    }

    const { shipments } = await response.json()
    console.log('ON SHIPPED DATA', JSON.stringify(shipments, null, 2))

    for (const shipment of shipments) {
      const { orderNumber, trackingNumber, carrierCode, serviceCode, shipmentCost, shipTo } =
        shipment

      console.log(
        'Order Number',
        orderNumber,
        'Tracking Number',
        trackingNumber,
        'Carrier Code',
        carrierCode,
        'Service Code',
        serviceCode,
      )

      // Find the client id using the order number
      const { data, error } = await locals.supabase
        .from('Outbound_Shipments')
        .select('Client_Id')
        .eq('Shipment_Number', orderNumber)
        .eq('Status', 'Pending')

      console.log('Payload to get Client Id', data)

      if (error) {
        console.error('Error finding clientId by Shipment Number')
      }

      const clientId = data[0]?.Client_Id

      console.log('CLIENT ID', clientId)

      // Update the Carrier and Tracking_Number for all matching rows
      // Potentially add the clientId as something to include in the lookup
      const { error: updateError } = await locals.supabase
        .from('Outbound_Shipments')
        .update({
          Carrier: serviceCode,
          Tracking_Number: trackingNumber,
          Status: 'Shipped',
          Cost_Of_Shipment: shipmentCost,
        })
        .eq('Shipment_Number', orderNumber)

      if (updateError) {
        console.error('Error updating Outbound_Shipments carrier and tracking number:', updateError)
      } else {
        console.log(
          'Outbound_Shipments were successfully updated with carrier and tracking number.',
        )
      }

      // Send the client an email notification with carrier and tracking information
      //     const apiKey = import.meta.env.VITE_SEND_GRID_API_KEY
      //     const endpoint = 'https://api.sendgrid.com/v3/mail/send'

      //     let notificationEmail = ''
      //     if (clientId === 'jen@bessiesbest.com') {
      //       notificationEmail = 'storageandfulfillment@hometown-industries.com'
      //     } else {
      //       notificationEmail = clientId
      //     }

      //     const emailData = {
      //       personalizations: [
      //         {
      //           to: [
      //             { email: notificationEmail }, // Ensure this email is correctly formatted
      //             { email: 'storageandfulfillment@hometown-industries.com' },
      //           ],
      //           subject: `Tracking has been updated for Shipment Number: ${orderNumber}`,
      //         },
      //       ],
      //       from: { email: 'storageandfulfillment@hometown-industries.com', name: 'Inventory Update' },
      //       content: [
      //         {
      //           type: 'text/html',
      //           value: `
      //         <p>Tracking has been updated for Shipment Number: <strong>${orderNumber}</strong></p>
      //         <ul>
      //           <li><strong>Carrier:</strong> ${serviceCode}</li>
      //           <li><strong>Tracking Number:</strong> ${trackingNumber}</li>
      //           <li><strong>Customer Name:</strong> ${shipTo?.name}</li>
      //         </ul>
      //          <p>For more details on the shipment, please login to your <a href="https://3pl-client-portal.vercel.app/app"><strong>Client Portal</strong></a>.</p>`,
      //         },
      //       ],
      //     }

      //     await fetch(endpoint, {
      //       method: 'POST',
      //       headers: {
      //         'Content-Type': 'application/json',
      //         Authorization: `Bearer ${apiKey}`,
      //       },
      //       body: JSON.stringify(emailData),
      //     })
    }
    return json({ success: true }, { headers })
  } catch (err) {
    console.error('Error processing webhook:', err)
    return json({ error: 'Invalid request' }, { status: 400, headers })
  }
}

// Handle CORS preflight requests
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

// const response = {
//   "shipments": [
//     {
//       "shipmentId": 271726263,
//       "orderId": 470873934,
//       "orderKey": "SHIP-1726505556889-44646",
//       "userId": "9e236874-e1c0-4241-8f93-a8223072efd4",
//       "customerEmail": null,
//       "orderNumber": "SHIP-1726505556889-44646",
//       "createDate": "2024-09-17T10:51:14.5030000",
//       "shipDate": "2024-09-17",
//       "shipmentCost": 39.57,
//       "insuranceCost": 0,
//       "trackingNumber": "1Z1V152Y6827822533",
//       "isReturnLabel": false,
//       "batchNumber": null,
//       "carrierCode": "ups_walleted",
//       "serviceCode": "ups_standard_international",
//       "packageCode": "package",
//       "confirmation": null,
//       "warehouseId": 499995,
//       "voided": false,
//       "voidDate": null,
//       "marketplaceNotified": false,
//       "notifyErrorMessage": null,
//       "shipTo": {
//         "name": "NA",
//         "company": "YYC4 Amazon Canada Fulfillment Services, ULC",
//         "street1": "6635 106 Ave SE",
//         "street2": "",
//         "street3": null,
//         "city": "Calgary",
//         "state": "AB",
//         "postalCode": "T2C 5X1",
//         "country": "CA",
//         "phone": null,
//         "residential": null,
//         "addressVerified": null
//       },
//       "weight": {
//         "value": 384,
//         "units": "ounces",
//         "WeightUnits": 1
//       },
//       "dimensions": {
//         "units": "inches",
//         "length": 21,
//         "width": 7,
//         "height": 11
//       },
//       "insuranceOptions": {
//         "provider": null,
//         "insureShipment": false,
//         "insuredValue": 0
//       },
//       "advancedOptions": {
//         "billToParty": null,
//         "billToAccount": null,
//         "billToPostalCode": null,
//         "billToCountryCode": null,
//         "storeId": 518236
//       },
//       "shipmentItems": null,
//       "labelData": null,
//       "formData": null
//     }
//   ],
//   "total": 1,
//   "page": 1,
//   "pages": 1
// }

// Webhook received On Shipped Event: {
//   resource_url: 'https://ssapi.shipstation.com/shipments?batchId=144015674&includeShipmentItems=False',
//     resource_type: 'SHIP_NOTIFY'
// }
