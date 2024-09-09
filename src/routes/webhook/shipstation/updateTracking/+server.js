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

    const data = await response.json()
    console.log("RESPONSE", data)

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