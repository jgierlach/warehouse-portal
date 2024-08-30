import fetch from 'node-fetch';
import { json } from '@sveltejs/kit';

export async function PUT({ request, locals }) {
  const {
    id,
    createdAt,
    clientId,
    shipmentNumber,
    bolNumber,
    carrier,
    trackingNumber,
    destination,
    shipmentType,
    status,
    dateOfLastChange,
    asin,
    productTitle,
    sku,
    productImageUrl,
    quantity,
    countedQuantity,
    warehouseAddress,
    warehousePostalCode,
    warehouseCity,
    warehouseState,
  } = await request.json();

  const row = {
    id: id,
    created_at: createdAt,
    Client_Id: clientId,
    Shipment_Number: shipmentNumber,
    Carrier: carrier,
    Tracking_Number: trackingNumber,
    BOL_Number: bolNumber,
    Destination: destination,
    Shipment_Type: shipmentType,
    Status: status,
    Date_Of_Last_Change: dateOfLastChange,
    Asin: asin,
    Product_Title: productTitle,
    Sku: sku,
    Product_Image_Url: productImageUrl,
    Quantity: quantity,
    Counted_Quantity: countedQuantity,
    Warehouse_Address: warehouseAddress,
    Warehouse_Postal_Code: warehousePostalCode,
    Warehouse_City: warehouseCity,
    Warehouse_State: warehouseState
  }

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
    body: { message: 'Outbound shipment was edited' },
  });
}
