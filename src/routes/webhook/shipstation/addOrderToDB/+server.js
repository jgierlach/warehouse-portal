import { json } from '@sveltejs/kit';
import { assignClientIdBasedOnStoreName } from '$lib/utils';

// Disable CSRF protection for this webhook route
export const config = {
  csrf: false
};

export async function POST({ request, locals }) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',  // Allow requests from any origin
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const event = await request.json();

    console.log('Webhook received:', event);

    // Check if the event contains a resource_url
    if (!event.resource_url) {
      return json({ error: 'Invalid webhook payload: no resource_url provided' }, { status: 400, headers });
    }

    // Fetch order data from ShipStation using the resource_url
    const response = await fetch(event.resource_url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(import.meta.env.VITE_SHIPSTATION_API_KEY + ':' + import.meta.env.VITE_SHIPSTATION_SECRET).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch order data:', response.status, response.statusText);
      return json({ error: 'Failed to fetch order data' }, { status: 500, headers });
    }

    const { orders } = await response.json();
    console.log('Fetched orders', JSON.stringify(orders, null, 2));

    const allShipmentData = [];

    // Loop through each order and process it
    for (const order of orders) {
      const {
        orderNumber,
        carrierCode,
        trackingNumber,
        shipTo,
        items,
        advancedOptions,
        customerEmail,
        orderDate,
        shippingAmount,
        customerNotes
      } = order;

      const clientId = assignClientIdBasedOnStoreName(advancedOptions?.source);

      console.log("CLIENT ID", clientId);

      // Loop through each item in the order
      const shipmentData = items.map(item => ({
        Client_Id: clientId || null,
        Shipment_Number: orderNumber || null,
        Carrier: carrierCode || null,
        Tracking_Number: trackingNumber || null,
        PO_Number: orderNumber || null,
        Destination: advancedOptions?.source || null,
        Requires_Amazon_Labeling: "No",
        Shipment_Type: 'Outbound',  // Default or map from payload if available
        Status: 'Pending',  // Set a default status
        Date_Of_Last_Change: orderDate || null,
        Asin: item.upc || null,  // Using UPC as a proxy for ASIN in the payload
        Product_Title: item.name || null,  // Title of the product (SKU)
        Sku: item.sku || null,  // SKU for the product
        Product_Image_Url: item.imageUrl || null,  // Image URL if available
        Quantity: item.quantity || 1,  // Quantity of the current item
        Buyer_Name: shipTo?.name || null,
        Buyer_Email: customerEmail || null,
        Recipient_Name: shipTo?.name || null,
        Recipient_Company: shipTo?.company || null,
        Recipient_Address_Line_1: shipTo?.street1 || null,
        Recipient_City: shipTo?.city || null,
        Recipient_State: shipTo?.state || null,
        Recipient_Postal_Code: shipTo?.postalCode || null,
        Notes: customerNotes || null,  // Any internal notes provided
        Cost_Of_Shipment: shippingAmount || null,  // Cost of the shipment, if available
      }));

      allShipmentData.push(...shipmentData);
    }

    console.log('All Shipment Data:', JSON.stringify(allShipmentData, null, 2));

    // Insert all shipment data into the database
    const { data, error } = await locals.supabase
      .from('Outbound_Shipments')
      .insert(allShipmentData);

    console.log('Insert result:', data, error);

    if (error) {
      console.error('Error inserting shipment data:', error);
      return json({ error: 'Failed to process shipment' }, { status: 500, headers });
    }

    return json({ success: true }, { headers });

  } catch (err) {
    console.error('Error processing webhook:', err);
    return json({ error: 'Invalid request' }, { status: 400, headers });
  }
}

// Handle CORS preflight requests
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// import { json } from '@sveltejs/kit';
// import { assignClientIdBasedOnStoreName } from '$lib/utils';

// export async function POST({ request, locals }) {
//   try {
//     const event = await request.json();

//     console.log('Webhook received:', event);

//     // Check if the event contains a resource_url
//     if (!event.resource_url) {
//       return json({ error: 'Invalid webhook payload: no resource_url provided' }, { status: 400 });
//     }

//     // Fetch order data from ShipStation using the resource_url
//     const response = await fetch(event.resource_url, {
//       headers: {
//         'Authorization': `Basic ${Buffer.from(import.meta.env.VITE_SHIPSTATION_API_KEY + ':' + import.meta.env.VITE_SHIPSTATION_SECRET).toString('base64')}`,
//         'Content-Type': 'application/json'
//       }
//     });

//     if (!response.ok) {
//       console.error('Failed to fetch order data:', response.status, response.statusText);
//       return json({ error: 'Failed to fetch order data' }, { status: 500 });
//     }

//     const { orders } = await response.json();
//     console.log('Fetched orders', JSON.stringify(orders, null, 2));

//     const allShipmentData = [];

//     // Loop through each order and process it
//     for (const order of orders) {
//       const {
//         orderNumber,
//         carrierCode,
//         trackingNumber,
//         shipTo,
//         items,
//         advancedOptions,
//         customerEmail,
//         orderDate,
//         shippingAmount,
//         customerNotes
//       } = order;

//       const clientId = assignClientIdBasedOnStoreName(advancedOptions?.source);

//       console.log("CLIENT ID", clientId);

//       // Loop through each item in the order
//       const shipmentData = items.map(item => ({
//         Client_Id: clientId || null,
//         Shipment_Number: orderNumber || null,
//         Carrier: carrierCode || null,
//         Tracking_Number: trackingNumber || null,
//         PO_Number: orderNumber || null,
//         Destination: advancedOptions?.source || null,
//         Requires_Amazon_Labeling: "No",
//         Shipment_Type: 'Outbound',  // Default or map from payload if available
//         Status: 'Pending',  // Set a default status
//         Date_Of_Last_Change: orderDate || null,
//         Asin: item.upc || null,  // Using UPC as a proxy for ASIN in the payload
//         Product_Title: item.name || null,  // Title of the product (SKU)
//         Sku: item.sku || null,  // SKU for the product
//         Product_Image_Url: item.imageUrl || null,  // Image URL if available
//         Quantity: item.quantity || 1,  // Quantity of the current item
//         Buyer_Name: shipTo?.name || null,
//         Buyer_Email: customerEmail || null,
//         Recipient_Name: shipTo?.name || null,
//         Recipient_Company: shipTo?.company || null,
//         Recipient_Address_Line_1: shipTo?.street1 || null,
//         Recipient_City: shipTo?.city || null,
//         Recipient_State: shipTo?.state || null,
//         Recipient_Postal_Code: shipTo?.postalCode || null,
//         Notes: customerNotes || null,  // Any internal notes provided
//         Cost_Of_Shipment: shippingAmount || null,  // Cost of the shipment, if available
//       }));

//       allShipmentData.push(...shipmentData);
//     }

//     console.log('All Shipment Data:', JSON.stringify(allShipmentData, null, 2));

//     // Insert all shipment data into the database
//     const { data, error } = await locals.supabase
//       .from('Outbound_Shipments')
//       .insert(allShipmentData);

//     console.log('Insert result:', data, error);

//     if (error) {
//       console.error('Error inserting shipment data:', error);
//       return json({ error: 'Failed to process shipment' }, { status: 500 });
//     }

//     return json({ success: true });

//   } catch (err) {
//     console.error('Error processing webhook:', err);
//     return json({ error: 'Invalid request' }, { status: 400 });
//   }
// }


// import { json } from '@sveltejs/kit';
// import { assignClientIdBasedOnStoreName } from '$lib/utils';

// export async function POST({ request, locals }) {
//   try {
//     const event = await request.json();

//     console.log('Webhook received:', event);

//     // Check if the event contains a resource_url
//     if (!event.resource_url) {
//       return json({ error: 'Invalid webhook payload: no resource_url provided' }, { status: 400 });
//     }

//     // Fetch order data from ShipStation using the resource_url
//     const response = await fetch(event.resource_url, {
//       headers: {
//         'Authorization': `Basic ${Buffer.from(import.meta.env.VITE_SHIPSTATION_API_KEY + ':' + import.meta.env.VITE_SHIPSTATION_SECRET).toString('base64')}`,
//         'Content-Type': 'application/json'
//       }
//     });

//     if (!response.ok) {
//       console.error('Failed to fetch order data:', response.status, response.statusText);
//       return json({ error: 'Failed to fetch order data' }, { status: 500 });
//     }

//     const orderData = await response.json();
//     console.log('Fetched order data', JSON.stringify(orderData, null, 2));

//     // Now process the orderData as you did before
//     const {
//       orderNumber,
//       carrierCode,
//       trackingNumber,
//       shipTo,
//       items,
//       advancedOptions,
//       customerEmail,
//       orderDate,
//       shippingAmount,
//       customerNotes,
//     } = orderData;

//     const clientId = assignClientIdBasedOnStoreName(advancedOptions?.source);

//     console.log("CLIENT ID", clientId);

//     // Loop through each item in the shipment
//     const shipmentData = items.map(item => ({
//       Client_Id: clientId || null,
//       Shipment_Number: orderNumber || null,
//       Carrier: carrierCode || null,
//       Tracking_Number: trackingNumber || null,
//       PO_Number: orderNumber || null,
//       Destination: advancedOptions?.source || null,
//       Requires_Amazon_Labeling: "No",
//       Shipment_Type: 'Outbound',  // Default or map from payload if available
//       Status: 'Pending',  // Set a default status
//       Date_Of_Last_Change: orderDate || null,
//       Asin: item.asin || null,  // ASIN if available, or set to null
//       Product_Title: item.name || null,  // Title of the product (SKU)
//       Sku: item.sku || null,  // SKU for the product
//       Product_Image_Url: item.imageUrl || null,  // Image URL if available
//       Quantity: item.quantity || 1,  // Quantity of the current item
//       Buyer_Name: shipTo?.name || null,
//       Buyer_Email: customerEmail || null,
//       Recipient_Name: shipTo?.name || null,
//       Recipient_Company: shipTo?.company || null,
//       Recipient_Address_Line_1: shipTo?.street1 || null,
//       Recipient_City: shipTo?.city || null,
//       Recipient_State: shipTo?.state || null,
//       Recipient_Postal_Code: shipTo?.postalCode || null,
//       Notes: customerNotes || null,  // Any internal notes provided
//       Cost_Of_Shipment: shippingAmount || null,  // Cost of the shipment, if available
//     }));

//     console.log('Shipment Data:', shipmentData);

//     // Insert the data into the database
//     const { data, error } = await locals.supabase
//       .from('Outbound_Shipments')
//       .insert(shipmentData);

//     console.log('Insert result:', data, error);

//     if (error) {
//       console.error('Error inserting shipment data:', error);
//       return json({ error: 'Failed to process shipment' }, { status: 500 });
//     }

//     return json({ success: true });

//   } catch (err) {
//     console.error('Error processing webhook:', err);
//     return json({ error: 'Invalid request' }, { status: 400 });
//   }
// }

// const orders = [
//   {
//     orderId: 466853087,
//     orderNumber: '112-5049003-1988269',
//     orderKey: '112-5049003-1988269',
//     orderDate: '2024-09-05T13:40:31.0000000',
//     createDate: '2024-09-05T14:47:08.8900000',
//     modifyDate: '2024-09-05T14:49:01.8870000',
//     paymentDate: '2024-09-05T13:40:31.0000000',
//     shipByDate: '2024-09-05T17:00:00.0000000',
//     orderStatus: 'on_hold',
//     customerId: null,
//     customerUsername: null,
//     customerEmail: null,
//     billTo: [Object],
//     shipTo: [Object],
//     items: [Array],
//     orderTotal: 0,
//     amountPaid: 0,
//     taxAmount: 0,
//     shippingAmount: 0,
//     customerNotes: null,
//     internalNotes: null,
//     gift: false,
//     giftMessage: null,
//     paymentMethod: 'Other',
//     requestedShippingService: 'Expedited',
//     carrierCode: null,
//     serviceCode: null,
//     packageCode: null,
//     confirmation: 'none',
//     shipDate: null,
//     holdUntilDate: null,
//     weight: [Object],
//     dimensions: null,
//     insuranceOptions: [Object],
//     internationalOptions: [Object],
//     advancedOptions: [Object],
//     tagIds: null,
//     userId: null,
//     externallyFulfilled: true,
//     externallyFulfilledBy: null,
//     externallyFulfilledById: null,
//     externallyFulfilledByName: null,
//     labelMessages: null
//   },
//   {
//     orderId: 466853096,
//     orderNumber: '113-7564840-1058642',
//     orderKey: '113-7564840-1058642',
//     orderDate: '2024-09-05T13:41:50.0000000',
//     createDate: '2024-09-05T14:47:10.6300000',
//     modifyDate: '2024-09-05T14:49:01.8870000',
//     paymentDate: '2024-09-05T13:41:50.0000000',
//     shipByDate: '2024-09-05T17:00:00.0000000',
//     orderStatus: 'on_hold',
//     customerId: null,
//     customerUsername: null,
//     customerEmail: null,
//     billTo: [Object],
//     shipTo: [Object],
//     items: [Array],
//     orderTotal: 0,
//     amountPaid: 0,
//     taxAmount: 0,
//     shippingAmount: 0,
//     customerNotes: null,
//     internalNotes: null,
//     gift: false,
//     giftMessage: null,
//     paymentMethod: 'Other',
//     requestedShippingService: 'Expedited',
//     carrierCode: null,
//     serviceCode: null,
//     packageCode: null,
//     confirmation: 'none',
//     shipDate: null,
//     holdUntilDate: null,
//     weight: [Object],
//     dimensions: null,
//     insuranceOptions: [Object],
//     internationalOptions: [Object],
//     advancedOptions: [Object],
//     tagIds: null,
//     userId: null,
//     externallyFulfilled: true,
//     externallyFulfilledBy: null,
//     externallyFulfilledById: null,
//     externallyFulfilledByName: null,
//     labelMessages: null
//   },
//   {
//     orderId: 466853093,
//     orderNumber: '112-3114990-4857013',
//     orderKey: '112-3114990-4857013',
//     orderDate: '2024-09-05T13:41:52.0000000',
//     createDate: '2024-09-05T14:47:10.0330000',
//     modifyDate: '2024-09-05T14:49:01.8870000',
//     paymentDate: '2024-09-05T13:41:52.0000000',
//     shipByDate: '2024-09-05T17:00:00.0000000',
//     orderStatus: 'on_hold',
//     customerId: null,
//     customerUsername: null,
//     customerEmail: null,
//     billTo: [Object],
//     shipTo: [Object],
//     items: [Array],
//     orderTotal: 0,
//     amountPaid: 0,
//     taxAmount: 0,
//     shippingAmount: 0,
//     customerNotes: null,
//     internalNotes: null,
//     gift: false,
//     giftMessage: null,
//     paymentMethod: 'Other',
//     requestedShippingService: 'Expedited',
//     carrierCode: null,
//     serviceCode: null,
//     packageCode: null,
//     confirmation: 'none',
//     shipDate: null,
//     holdUntilDate: null,
//     weight: [Object],
//     dimensions: null,
//     insuranceOptions: [Object],
//     internationalOptions: [Object],
//     advancedOptions: [Object],
//     tagIds: null,
//     userId: null,
//     externallyFulfilled: true,
//     externallyFulfilledBy: null,
//     externallyFulfilledById: null,
//     externallyFulfilledByName: null,
//     labelMessages: null
//   }
// ]