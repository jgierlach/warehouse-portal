import fetch from 'node-fetch';
import { json } from '@sveltejs/kit';
import { assignClientIdBasedOnStoreName } from '$lib/utils'

export async function POST({ request, locals }) {

  try {
    const event = await request.json();

    console.log('Webhook received:', event);

    // Extracting fields from ShipStation's payload
    const {
      orderNumber,
      carrierCode,
      trackingNumber,
      shipTo,
      shipmentItems,
      advancedOptions,
      customerName,
      customerEmail,
      modifyDate,
      shipmentCost,
      storeId,  // Store ID to identify the source/channel
      storeName // Store Name, if provided
    } = event;

    const { recipient, address1, city, state, postalCode, company } = shipTo;

    const clientId = assignClientIdBasedOnStoreName(storeName)

    console.log("STORE NAME", storeName)
    console.log("CLIENT ID", clientId)

    // Loop through each item in the shipment
    const shipmentData = shipmentItems.map(item => ({
      Client_Id: clientId,
      Shipment_Number: orderNumber,
      Carrier: carrierCode,
      Tracking_Number: trackingNumber,
      PO_Number: orderNumber,
      Destination: storeName,
      Requires_Amazon_Labeling: advancedOptions?.requiresAmazonLabeling || null,
      Shipment_Type: 'Outbound',  // Default or map from payload if available
      Status: 'Pending',  // Set a default status
      Date_Of_Last_Change: modifyDate,
      Asin: item.asin || null,  // ASIN if available, or set to null
      Product_Title: item.name || null,  // Title of the product (SKU)
      Sku: item.sku || null,  // SKU for the product
      Product_Image_Url: item.imageUrl || null,  // Image URL if available
      Quantity: item.quantity || 1,  // Quantity of the current item
      Buyer_Name: customerName,
      Buyer_Email: customerEmail,
      Recipient_Name: recipient,
      Recipient_Company: company || null,
      Recipient_Address_Line_1: address1,
      Recipient_City: city,
      Recipient_State: state,
      Recipient_Postal_Code: postalCode,
      Notes: event.internalNotes || null,  // Any internal notes provided
      Cost_Of_Shipment: shipmentCost || null,  // Cost of the shipment, if available
    }));

    // Insert multiple rows for each SKU in the shipmentItems array
    const { data, error } = await locals.supabase
      .from('Outbound_Shipments')
      .insert(shipmentData);

    if (error) {
      console.error('Error inserting shipment data:', error);
      return json({ error: 'Failed to process shipment' }, { status: 500 });
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error parsing webhook data:', err);
    return json({ error: 'Invalid request' }, { status: 400 });
  }
}