import fetch from 'node-fetch';
import { json } from '@sveltejs/kit';
import { formatDate } from "$lib/utils"

export async function POST({ request, locals }) {

  const {
    clientId,
    shipmentNumber,
    carrier,
    trackingNumber,
    poNumber,
    destination,
    requiresAmazonLabeling,
    asin,
    productTitle,
    sku,
    status,
    dateOfLastChange,
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
    country,
    lotNumber
  } = await request.json();

  const myDate = new Date(dateOfLastChange);
  const formattedDate = formatDate(myDate);

  const row = {
    // Inventory_Id: Inventory_Id,
    Client_Id: clientId,
    Shipment_Number: shipmentNumber,
    Carrier: carrier,
    Tracking_Number: trackingNumber,
    PO_Number: poNumber,
    Destination: destination,
    Requires_Amazon_Labeling: requiresAmazonLabeling,
    Shipment_Type: "Outbound",
    Status: status,
    Date_Of_Last_Change: formattedDate,
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
    Recipient_Postal_Code: recipientPostalCode,
    Recipient_Country: country,
    Lot_Number: lotNumber,
    Notes: ''
  };

  const { data, error } = await locals.supabase
    .from('Outbound_Shipments')
    .insert([row])
    .select();

  if (error) {
    console.error(error);
    return;
  }

  return json({
    status: 200,
    body: { message: 'Outbound shipment was created!' },
  });
}
