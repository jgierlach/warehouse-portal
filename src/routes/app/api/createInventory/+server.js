import fetch from 'node-fetch';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {

  const {
    // id,
    // createdAt,
    clientId,
    name,
    asin,
    productTitle,
    sku,
    productImageUrl,
    pending,
    quantity,
  } = await request.json();

  const row = {
    // id: id,
    // created_at: createdAt,
    Client_Id: clientId,
    Name: name,
    Asin: asin,
    Product_Title: productTitle,
    Sku: sku,
    Product_Image_Url: productImageUrl,
    Pending: pending,
    Quantity: quantity
  };

  const { data, error } = await locals.supabase
    .from('Inventory')
    .insert([row])
    .select();

  if (error) {
    console.error(error);
    return;
  }

  return json({
    status: 200,
    body: { message: 'Inventory was created!' },
  });
}
