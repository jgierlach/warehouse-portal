import { json } from '@sveltejs/kit';
import { fetchStores, findStoreNameBasedOnId, assignClientIdBasedOnStoreName } from '$lib/utils';

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

      const storeId = advancedOptions?.storeId

      const stores = await fetchStores()

      const storeName = findStoreNameBasedOnId(storeId, stores)

      const clientId = assignClientIdBasedOnStoreName(storeName);

      console.log("CLIENT ID", clientId);

      // Loop through each item in the order
      const shipmentData = items.map(item => ({
        Client_Id: clientId || null,
        Shipment_Number: orderNumber || null,
        Carrier: carrierCode || null,
        Tracking_Number: trackingNumber || null,
        PO_Number: orderNumber || null,
        Destination: storeName || null,
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

// const fetchedOrders = [
//   {
//     "orderId": 468167973,
//     "orderNumber": "1615",
//     "orderKey": "5007438479437",
//     "orderDate": "2024-09-09T08:37:13.0000000",
//     "createDate": "2024-09-09T11:37:53.1100000",
//     "modifyDate": "2024-09-09T11:37:54.6330000",
//     "paymentDate": "2024-09-09T08:37:13.0000000",
//     "shipByDate": null,
//     "orderStatus": "awaiting_shipment",
//     "customerId": 231093810,
//     "customerUsername": "6867004293197",
//     "customerEmail": "gplivengood@yahoo.com",
//     "billTo": {
//       "name": "Gary Livengood",
//       "company": null,
//       "street1": null,
//       "street2": null,
//       "street3": null,
//       "city": null,
//       "state": null,
//       "postalCode": null,
//       "country": null,
//       "phone": null,
//       "residential": null,
//       "addressVerified": null
//     },
//     "shipTo": {
//       "name": "Gary Livengood",
//       "company": null,
//       "street1": "3170 PERCH DR SW",
//       "street2": "",
//       "street3": null,
//       "city": "MARIETTA",
//       "state": "GA",
//       "postalCode": "30008-5941",
//       "country": "US",
//       "phone": null,
//       "residential": true,
//       "addressVerified": "Address validated successfully"
//     },
//     "items": [
//       {
//         "orderItemId": 780196814,
//         "lineItemKey": "12440885952589",
//         "sku": "FPPF-SVOR-MD01",
//         "name": "FilterPal® Pre-Filter - M / Orange",
//         "imageUrl": "https://cdn.shopify.com/s/files/1/0266/4241/5693/products/Orange_OnFilter_Medium_fa34da4b-03b7-4557-8268-8e1692b8c7db.png?v=1638316160",
//         "weight": {
//           "value": 1.5,
//           "units": "ounces",
//           "WeightUnits": 1
//         },
//         "quantity": 1,
//         "unitPrice": 16.99,
//         "taxAmount": 0,
//         "shippingAmount": 0,
//         "warehouseLocation": null,
//         "options": [],
//         "productId": 29845169,
//         "fulfillmentSku": null,
//         "adjustment": false,
//         "upc": "",
//         "createDate": "2024-09-09T11:37:53.063",
//         "modifyDate": "2024-09-09T11:37:53.063"
//       }
//     ],
//     "orderTotal": 16.99,
//     "amountPaid": 16.99,
//     "taxAmount": 0,
//     "shippingAmount": 0,
//     "customerNotes": null,
//     "internalNotes": null,
//     "gift": false,
//     "giftMessage": null,
//     "paymentMethod": "",
//     "requestedShippingService": "Standard FilterPal Shipping",
//     "carrierCode": null,
//     "serviceCode": null,
//     "packageCode": null,
//     "confirmation": "none",
//     "shipDate": null,
//     "holdUntilDate": null,
//     "weight": {
//       "value": 1.5,
//       "units": "ounces",
//       "WeightUnits": 1
//     },
//     "dimensions": null,
//     "insuranceOptions": {
//       "provider": null,
//       "insureShipment": false,
//       "insuredValue": 0
//     },
//     "internationalOptions": {
//       "contents": null,
//       "customsItems": null,
//       "nonDelivery": null
//     },
//     "advancedOptions": {
//       "warehouseId": 499995,
//       "nonMachinable": false,
//       "saturdayDelivery": false,
//       "containsAlcohol": false,
//       "mergedOrSplit": false,
//       "mergedIds": [],
//       "parentId": null,
//       "storeId": 792882,
//       "customField1": null,
//       "customField2": null,
//       "customField3": null,
//       "source": "web",
//       "billToParty": null,
//       "billToAccount": null,
//       "billToPostalCode": null,
//       "billToCountryCode": null,
//       "billToMyOtherAccount": null
//     },
//     "tagIds": null,
//     "userId": null,
//     "externallyFulfilled": false,
//     "externallyFulfilledBy": null,
//     "externallyFulfilledById": null,
//     "externallyFulfilledByName": null,
//     "labelMessages": null
//   }
// ]

// const fetchedOrders = [
//   {
//     "orderId": 468190807,
//     "orderNumber": "112-9642641-7659452",
//     "orderKey": "112-9642641-7659452",
//     "orderDate": "2024-08-11T19:03:20.0000000",
//     "createDate": "2024-09-09T12:05:45.3500000",
//     "modifyDate": "2024-09-09T12:08:59.1770000",
//     "paymentDate": "2024-08-11T19:03:20.0000000",
//     "shipByDate": "2024-08-11T17:00:00.0000000",
//     "orderStatus": "shipped",
//     "customerId": 231101599,
//     "customerUsername": "ldm5wnmn5dm4v04@marketplace.amazon.com",
//     "customerEmail": "ldm5wnmn5dm4v04@marketplace.amazon.com",
//     "billTo": {
//       "name": "",
//       "company": null,
//       "street1": "",
//       "street2": "",
//       "street3": "",
//       "city": "Gaitherburg",
//       "state": "Maryland",
//       "postalCode": "20878",
//       "country": "US",
//       "phone": "",
//       "residential": null,
//       "addressVerified": null
//     },
//     "shipTo": {
//       "name": "",
//       "company": "",
//       "street1": "",
//       "street2": "",
//       "street3": "",
//       "city": "Gaitherburg",
//       "state": "MD",
//       "postalCode": "20878",
//       "country": "US",
//       "phone": "",
//       "residential": false,
//       "addressVerified": "Address validation failed"
//     },
//     "items": [
//       {
//         "orderItemId": 780231203,
//         "lineItemKey": "107098493204121",
//         "sku": "B07GJZDVRK",
//         "name": "Dixie Belle Synthetic Flat Small Paint Brush | 1” Quality Synthetic Smooth Release Bristles | Professional Grade Paint Brush | Made in The USA",
//         "imageUrl": "https://m.media-amazon.com/images/I/41ag8sKLnPL.jpg",
//         "weight": {
//           "value": 1.55,
//           "units": "ounces",
//           "WeightUnits": 1
//         },
//         "quantity": 1,
//         "unitPrice": 19.99,
//         "taxAmount": 1.2,
//         "shippingAmount": 0,
//         "warehouseLocation": "",
//         "options": [],
//         "productId": 38404774,
//         "fulfillmentSku": null,
//         "adjustment": false,
//         "upc": "815146025493",
//         "createDate": "2024-09-09T12:05:45.317",
//         "modifyDate": "2024-09-09T12:05:45.317"
//       }
//     ],
//     "orderTotal": 21.19,
//     "amountPaid": 21.19,
//     "taxAmount": 1.2,
//     "shippingAmount": 0,
//     "customerNotes": null,
//     "internalNotes": null,
//     "gift": false,
//     "giftMessage": null,
//     "paymentMethod": "Other",
//     "requestedShippingService": "Expedited",
//     "carrierCode": null,
//     "serviceCode": null,
//     "packageCode": null,
//     "confirmation": "none",
//     "shipDate": null,
//     "holdUntilDate": null,
//     "weight": {
//       "value": 1.55,
//       "units": "ounces",
//       "WeightUnits": 1
//     },
//     "dimensions": null,
//     "insuranceOptions": {
//       "provider": null,
//       "insureShipment": false,
//       "insuredValue": 0
//     },
//     "internationalOptions": {
//       "contents": null,
//       "customsItems": null,
//       "nonDelivery": null
//     },
//     "advancedOptions": {
//       "warehouseId": 499995,
//       "nonMachinable": false,
//       "saturdayDelivery": false,
//       "containsAlcohol": false,
//       "mergedOrSplit": false,
//       "mergedIds": [],
//       "parentId": null,
//       "storeId": 789750,
//       "customField1": "",
//       "customField2": "",
//       "customField3": "",
//       "source": "amazon",
//       "billToParty": null,
//       "billToAccount": null,
//       "billToPostalCode": null,
//       "billToCountryCode": null,
//       "billToMyOtherAccount": null
//     },
//     "tagIds": null,
//     "userId": null,
//     "externallyFulfilled": true,
//     "externallyFulfilledBy": null,
//     "externallyFulfilledById": null,
//     "externallyFulfilledByName": null,
//     "labelMessages": null
//   }
// ]