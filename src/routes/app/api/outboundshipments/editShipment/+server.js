import fetch from 'node-fetch';
import { json } from '@sveltejs/kit';

export async function PUT({ request, locals }) {
  const {
    id,
    createdAt,
    clientId,
    shipmentNumber,
    carrier,
    trackingNumber,
    poNumber,
    destination,
    requiresAmazonLabeling,
    shipmentType,
    status,
    dateOfLastChange,
    asin,
    productTitle,
    sku,
    productImageUrl,
    quantity,
    buyerName,
    buyerEmail,
    recipientName,
    recipientCompany,
    recipientAddressLine1,
    recipientCity,
    recipientState,
    recipientPostalCode,
  } = await request.json();

  const row = {
    id: id,
    created_at: createdAt,
    Client_Id: clientId,
    Shipment_Number: shipmentNumber,
    Carrier: carrier,
    Tracking_Number: trackingNumber,
    PO_Number: poNumber,
    Destination: destination,
    Requires_Amazon_Labeling: requiresAmazonLabeling,
    Shipment_Type: shipmentType,
    Status: status,
    Date_Of_Last_Change: dateOfLastChange,
    Asin: asin,
    Product_Title: productTitle,
    Sku: sku,
    Product_Image_Url: productImageUrl,
    Quantity: quantity,
    Buyer_Name: buyerName,
    Buyer_Email: buyerEmail,
    Recipient_Name: recipientName,
    Recipient_Company: recipientCompany,
    Recipient_Address_Line_1: recipientAddressLine1,
    Recipient_City: recipientCity,
    Recipient_State: recipientState,
    Recipient_Postal_Code: recipientPostalCode
  };

  const { data, error } = await locals.supabase
    .from('Outbound_Shipments')
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
