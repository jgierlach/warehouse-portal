import { json } from '@sveltejs/kit';

// Disable CSRF protection for this webhook route
export const config = {
  csrf: false
};

export async function POST({ request, locals }) {

  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',  // Allow requests from any origin
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const event = await request.json();
    console.log('Webhook received On Shipped Event:', event);

    // Check if the event contains a resource_url
    if (!event.resource_url) {
      return json({ error: 'Invalid webhook payload: no resource_url provided' }, { status: 400, headers });
    }

    // Fetch order data from ShipStation using the resource_url
    const response = await fetch(event.resource_url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(import.meta.env.VITE_SHIPSTATION_API_KEY + ':' + import.meta.env.VITE_SHIPSTATION_SECRET).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch order data:', response.status, response.statusText);
      return json({ error: 'Failed to fetch order data' }, { status: 500, headers });
    }

    const { fulfillments } = await response.json()
    console.log('Fulfillments', JSON.stringify(fulfillments, null, 2));

    for (const fulfillment of fulfillments) {
      const { orderNumber, customerEmail, trackingNumber, carrierCode } = fulfillment

      console.log("Order Number", orderNumber, "Customer Email", customerEmail, "Tracking Number", trackingNumber, "Carrier Code", carrierCode)

      // Find the client id using the order number
      const { data, error } = await locals.supabase
        .from('Outbound_Shipments')
        .select('Client_Id')
        .eq('Shipment_Number', orderNumber)
        .single();  // Ensures only one row is returned

      console.log("Payload to get Client Id", data)

      if (error) {
        console.error('Error finding clientId by Shipment Number')
      }

      let clientId = data?.Client_Id

      console.log("CLIENT ID", clientId)

      // Update the Carrier and Tracking_Number for all matching rows
      const { error: updateError } = await locals.supabase
        .from('Outbound_Shipments')
        .update({
          Carrier: carrierCode,
          Tracking_Number: trackingNumber,
          Status: "Shipped"
        })
        .eq('Shipment_Number', orderNumber);

      if (updateError) {
        console.error('Error updating Outbound_Shipments carrier and tracking number:', updateError);
      } else {
        console.log('Outbound_Shipments were successfully updated with carrier and tracking number.');
      }

      // Send the client an email notification with carrier and tracking information
      const apiKey = import.meta.env.VITE_SEND_GRID_API_KEY;
      const endpoint = 'https://api.sendgrid.com/v3/mail/send';

      const emailData = {
        personalizations: [
          {
            to: [
              { email: clientId },  // Ensure this email is correctly formatted
              { email: "storageandfulfillment@hometown-industries.com" }
            ],
            subject: `Tracking has been updated for Shipment Number: ${orderNumber}`,
          },
        ],
        from: { email: 'storageandfulfillment@hometown-industries.com', name: 'Inventory Update' },
        content: [
          {
            type: 'text/html',
            value: `
          <p>Tracking has been updated for Shipment Number: <strong>${orderNumber}</strong></p> 
          <ul>
            <li><strong>Carrier:</strong> ${carrierCode}</li>
            <li><strong>Tracking Number:</strong> ${trackingNumber}</li>
          </ul>`
          }
        ],
      };

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(emailData),
      });
    }

    return json({ success: true }, { headers });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return json({ error: 'Invalid request' }, { status: 400, headers });
  }
}

// Handle CORS preflight requests
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// const Fulfillments = [
//   {
//     "fulfillmentId": 38186502,
//     "orderId": 469546774,
//     "orderNumber": "SHIP-1726172778573-66119",
//     "userId": "5fbe9b59-115c-4486-9800-d895ffb2b0ec",
//     "customerEmail": "storageandfulfillment@hometown-industries.com",
//     "trackingNumber": "56556565565",
//     "createDate": "2024-09-12T13:29:18.3230000",
//     "shipDate": "2024-09-12T00:00:00.0000000",
//     "voidDate": null,
//     "deliveryDate": null,
//     "carrierCode": "Airtranss",
//     "sellerFillProviderId": null,
//     "sellerFillProviderName": null,
//     "fulfillmentProviderCode": null,
//     "fulfillmentServiceCode": null,
//     "fulfillmentFee": 0,
//     "voidRequested": false,
//     "voided": false,
//     "marketplaceNotified": false,
//     "notifyErrorMessage": null,
//     "shipTo": {
//       "name": "Amazon FBA",
//       "company": "AMAZON",
//       "street1": "5505 O ST",
//       "street2": "",
//       "street3": null,
//       "city": "LINCOLN",
//       "state": "NE",
//       "postalCode": "68510-2151",
//       "country": "US",
//       "phone": null,
//       "residential": null,
//       "addressVerified": null
//     }
//   }
// ]