import fetch from 'node-fetch';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
  const {
    clientId,
    shipmentNumber,
    bolNumber,
    carrier,
    trackingNumber,
    destination,
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
    Client_Id: clientId,
    Shipment_Number: shipmentNumber,
    Carrier: carrier,
    Tracking_Number: trackingNumber,
    BOL_Number: bolNumber,
    Destination: destination,
    Shipment_Type: "Inbound",
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
    .insert([row])
    .select();

  if (error) {
    console.error(error);
    return;
  }

  return json({
    status: 200,
    body: { message: 'Inbound shipment was created' },
  });
}
