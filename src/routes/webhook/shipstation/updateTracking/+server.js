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

      if (error) {
        console.error('Error finding clientId by Shipment Number')
      }

      let clientId = data.Client_Id

      // Update the Carrier and Tracking_Number for all matching rows
      const { error: updateError } = await locals.supabase
        .from('Outbound_Shipments')
        .update({
          Carrier: carrierCode,
          Tracking_Number: trackingNumber
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

// DATA {
//   fulfillments: [
//     {
//       fulfillmentId: 38184659,
//       orderId: 469429114,
//       orderNumber: 'SHIP-1726156944646-54012',
//       userId: '9e236874-e1c0-4241-8f93-a8223072efd4',
//       customerEmail: 'storageandfulfillment@hometown-industries.com',
//       trackingNumber: '1Z 228 5Y8 03 0505 5914',
//       createDate: '2024-09-12T12:24:24.8430000',
//       shipDate: '2024-09-12T00:00:00.0000000',
//       voidDate: null,
//       deliveryDate: null,
//       carrierCode: 'UPS',
//       sellerFillProviderId: null,
//       sellerFillProviderName: null,
//       fulfillmentProviderCode: null,
//       fulfillmentServiceCode: null,
//       fulfillmentFee: 0,
//       voidRequested: false,
//       voided: false,
//       marketplaceNotified: false,
//       notifyErrorMessage: null,
//       shipTo: [Object]
//     }
//   ],
//   total: 1,
//   page: 1,
//   pages: 1
// }