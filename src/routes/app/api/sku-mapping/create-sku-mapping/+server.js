import { json } from '@sveltejs/kit'

export async function POST({ request, locals }) {
  try {
    const { product_id, client_id, sku, name, product_image_url, quantity_to_deduct } =
      await request.json()

    // Input validation
    if (!product_id || !client_id || !sku || !name || !product_image_url || !quantity_to_deduct) {
      return json({ message: 'Missing required fields.' }, { status: 400 })
    }

    // Insert data
    const { data, error } = await locals.supabase
      .from('sku_mapping')
      .insert([{ product_id, client_id, sku, name, quantity_to_deduct, product_image_url }])
      .select()

    // Handle Supabase errors
    if (error) {
      console.error('Supabase Insert Error:', error)
      return json({ message: 'SKU mapping failed.', error: error.message }, { status: 500 })
    }

    return json({ message: 'SKU mapping created!', data }, { status: 201 })
  } catch (err) {
    console.error('Server Error:', err)
    return json({ message: 'Internal server error.' }, { status: 500 })
  }
}
