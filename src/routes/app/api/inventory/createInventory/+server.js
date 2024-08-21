import fetch from 'node-fetch';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {

  const {
    clientId,
    name,
    asin,
    productTitle,
    sku,
    productImageUrl,
    pending,
    quantity,
    expirationDate
  } = await request.json();

  const row = {
    Client_Id: clientId,
    Name: name,
    Asin: asin,
    Product_Title: productTitle,
    Sku: sku,
    Product_Image_Url: productImageUrl,
    Pending: pending,
    Quantity: quantity,
    Product_Expiration: expirationDate
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
