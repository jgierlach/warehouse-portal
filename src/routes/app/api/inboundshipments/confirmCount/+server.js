import fetch from 'node-fetch';
import { json } from '@sveltejs/kit';

export async function PUT({ request, locals }) {
  const {
    id,
    countedQuantity,
  } = await request.json();

  console.log("COUNTED QUANTITY ON SERVER", countedQuantity)
  console.log("ID", id)

  const row = {
    id: id,
    Counted_Quantity: countedQuantity,
    Status: "Received"
  };

  const { data, error } = await locals.supabase
    .from('Inbound_Shipments')
    .update(row)
    .eq('id', id)
    .select();

  if (error) {
    console.error(error);
  }

  return json({
    status: 200,
    body: { message: 'Product count was confirmed' },
  });
}
