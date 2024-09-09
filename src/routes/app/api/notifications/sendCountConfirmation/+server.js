import fetch from 'node-fetch';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  const { clientId,
    shipmentNumber,
    sku,
    productTitle,
    quantity,
    countedQuantity } = await request.json();

  const apiKey = import.meta.env.VITE_SEND_GRID_API_KEY;
  const endpoint = 'https://api.sendgrid.com/v3/mail/send';

  const data = {
    personalizations: [
      {
        to: [
          { email: clientId },  // Ensure this email is correctly formatted
          { email: "storageandfulfillment@hometown-industries.com" }
        ],
        subject: `Confirming count for sku: ${sku} in ${shipmentNumber}`,
      },
    ],
    from: { email: 'storageandfulfillment@hometown-industries.com', name: 'Inventory Update' },
    content: [
      {
        type: 'text/html',
        value: `
          <p>For sku ${sku} the expected quantity on inbound shipment ${shipmentNumber} was ${quantity} units.</p>
          <ul>
            <li>We received ${countedQuantity} units</li>
            <li>The discrepancy in count is ${quantity - countedQuantity} units</li>
          </ul>`
      }
    ],
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(data),
  });

  let responseBody = {};

  try {
    responseBody = await response.json(); // Attempt to parse the response body as JSON
  } catch (err) {
    console.error('Error parsing JSON response:', err.message);
  }

  console.log('RESPONSE', response);
  console.log('RESPONSE BODY', responseBody);

  if (response.ok) {
    return json({
      status: 200,
      body: { message: 'Tracking notification email sent successfully' },
    });
  } else {
    return json({
      status: response.status,
      body: { message: `Failed to send email: ${responseBody.errors?.[0]?.message || 'Unknown error'}` },
    });
  }
}