import fetch from 'node-fetch';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  const { clientId, shipmentNumber, carrier, trackingNumber, poNumber, recipientName } = await request.json();

  const apiKey = import.meta.env.VITE_SEND_GRID_API_KEY;
  const endpoint = 'https://api.sendgrid.com/v3/mail/send';

  const data = {
    personalizations: [
      {
        to: [
          { email: clientId },  // Ensure this email is correctly formatted
          { email: "storageandfulfillment@hometown-industries.com" }
        ],
        subject: `Tracking has been updated for Shipment Number: ${shipmentNumber}`,
      },
    ],
    from: { email: 'storageandfulfillment@hometown-industries.com', name: 'Inventory Update' },
    content: [
      {
        type: 'text/html',
        value: `
          <p>Tracking has been updated for Shipment Number: <strong>${shipmentNumber}</strong></p> 
          <ul>
            <li><strong>Carrier:</strong> ${carrier}</li>
            <li><strong>Tracking Number:</strong> ${trackingNumber}</li>
          </ul>
          <ul>
            <li><strong>Customer Name:</strong> ${recipientName}</li>
            <li><strong>PO Number:</strong> ${poNumber}</li>
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