import fetch from 'node-fetch';
import { json } from '@sveltejs/kit';

export async function PUT({ request, locals }) {
  const { clientId, shipmentNumber, carrier, trackingNumber } = await request.json();

  const row = {
    Carrier: carrier,
    Tracking_Number: trackingNumber,
  };

  const { data, error } = await locals.supabase
    .from('Outbound_Shipments')
    .update(row)
    .eq('Shipment_Number', shipmentNumber)
    .eq('Client_Id', clientId)
    .select();

  if (error) {
    console.error(error);
  }

  return json({
    status: 200,
    body: { message: 'Tracking and carrier information was updated.' },
  });
}
