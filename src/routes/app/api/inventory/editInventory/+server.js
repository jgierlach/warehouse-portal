import { json } from '@sveltejs/kit'

export async function PUT({ request, locals }) {
  const {
    inventoryToEdit,
    id,
    createdAt,
    clientId,
    name,
    asin,
    productTitle,
    sku,
    productImageUrl,
    pending,
    quantity,
    expirationDate,
    lotNumber,
  } = await request.json()

  // Execute inventory changelog
  const log = {
    client_id: clientId,
    shipment_number: null,
    change_source: 'Warehouse Portal',
    name,
    asin,
    sku,
    previous_quantity: inventoryToEdit.Quantity,
    new_quantity: quantity,
    previous_pending: inventoryToEdit.Pending,
    new_pending: pending,
  }

  const { logData, logError } = await locals.supabase
    .from('inventory_changelog')
    .insert([log])
    .select()

  if (logError) {
    console.error(logError)
    return
  }

  const row = {
    id: id,
    created_at: createdAt,
    Client_Id: clientId,
    Name: name,
    Asin: asin,
    Product_Title: productTitle,
    Sku: sku,
    Product_Image_Url: productImageUrl,
    Pending: pending,
    Quantity: quantity,
    Product_Expiration: expirationDate,
    Lot_Number: lotNumber,
  }

  const { data, error } = await locals.supabase.from('Inventory').update(row).eq('id', id).select()

  if (error) {
    console.error(error)
  }

  return json({
    status: 200,
    body: { message: 'Inventory was edited' },
  })
}
