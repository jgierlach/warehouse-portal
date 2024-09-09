import { json } from '@sveltejs/kit';

export async function GET() {
  const apiKey = import.meta.env.VITE_SHIPSTATION_API_KEY;
  const apiSecret = import.meta.env.VITE_SHIPSTATION_SECRET;

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  const res = await fetch('https://ssapi.shipstation.com/stores', {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    return json({ error: 'Failed to fetch ShipStation stores' }, { status: res.status });
  }

  const data = await res.json();
  return json(data);
}
