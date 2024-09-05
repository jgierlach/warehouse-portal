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
      customerEmail,
      modifyDate,
      orderDate,
      shippingAmount,
      customerNotes,
    } = event;

    // Destructure shipTo fields
    const { name = 'Default', company = "ACME Enterprises", street1 = "5505 O Street", city = "Lincoln", state = "NE", postalCode = "68510", country = "US", phone = "123-456-7890" } = shipTo

    // Destructure advanced options
    const { storeId = "5252266", source = "Web Store" } = advancedOptions

    console.log("STORE NAME", source)

    const clientId = assignClientIdBasedOnStoreName(source)

    console.log("CLIENT ID", clientId)

    // Loop through each item in the shipment
    const shipmentData = shipmentItems.map(item => ({
      Client_Id: clientId,
      Shipment_Number: orderNumber,
      Carrier: carrierCode,
      Tracking_Number: trackingNumber,
      PO_Number: orderNumber,
      Destination: source,
      Requires_Amazon_Labeling: "No",
      Shipment_Type: 'Outbound',  // Default or map from payload if available
      Status: 'Pending',  // Set a default status
      Date_Of_Last_Change: orderDate,
      Asin: item.asin || null,  // ASIN if available, or set to null
      Product_Title: item.name || null,  // Title of the product (SKU)
      Sku: item.sku || null,  // SKU for the product
      Product_Image_Url: item.imageUrl || null,  // Image URL if available
      Quantity: item.quantity || 1,  // Quantity of the current item
      Buyer_Name: name,
      Buyer_Email: customerEmail,
      Recipient_Name: name,
      Recipient_Company: company || null,
      Recipient_Address_Line_1: street1,
      Recipient_City: city,
      Recipient_State: state,
      Recipient_Postal_Code: postalCode,
      Notes: customerNotes || null,  // Any internal notes provided
      Cost_Of_Shipment: shippingAmount || null,  // Cost of the shipment, if available
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

// const data = {
//   "orderId": 94113592,
//   "orderNumber": "TEST-ORDER-API-DOCS",
//   "orderKey": "0f6bec18-9-4771-83aa-f392d84f4c74",
//   "orderDate": "2015-06-29T08:46:27.0000000",
//   "createDate": "2015-07-16T14:00:34.8230000",
//   "modifyDate": "2015-09-08T11:03:12.3800000",
//   "paymentDate": "2015-06-29T08:46:27.0000000",
//   "shipByDate": "2015-07-05T00:00:00.0000000",
//   "orderStatus": "awaiting_shipment",
//   "customerId": 37701499,
//   "customerUsername": "headhoncho@whitehouse.gov",
//   "customerEmail": "headhoncho@whitehouse.gov",
//   "billTo": {
//     "name": "The President",
//     "company": null,
//     "street1": null,
//     "street2": null,
//     "street3": null,
//     "city": null,
//     "state": null,
//     "postalCode": null,
//     "country": null,
//     "phone": null,
//     "residential": null,
//     "addressVerified": null
//   },
//   "shipTo": {
//     "name": "The President",
//     "company": "US Govt",
//     "street1": "1600 Pennsylvania Ave",
//     "street2": "Oval Office",
//     "street3": null,
//     "city": "Washington",
//     "state": "DC",
//     "postalCode": "20500",
//     "country": "US",
//     "phone": "555-555-5555",
//     "residential": false,
//     "addressVerified": "Address validation warning"
//   },
//   "items": [
//     {
//       "orderItemId": 128836912,
//       "lineItemKey": "vd08-MSLbtx",
//       "sku": "ABC123",
//       "name": "Test item #1",
//       "imageUrl": null,
//       "weight": {
//         "value": 24,
//         "units": "ounces"
//       },
//       "quantity": 2,
//       "unitPrice": 99.99,
//       "taxAmount": null,
//       "shippingAmount": null,
//       "warehouseLocation": "Aisle 1, Bin 7",
//       "options": [
//         {
//           "name": "Size",
//           "value": "Large"
//         }
//       ],
//       "productId": 7239919,
//       "fulfillmentSku": null,
//       "adjustment": false,
//       "upc": null,
//       "createDate": "2015-07-16T14:00:34.823",
//       "modifyDate": "2015-07-16T14:00:34.823"
//     },
//     {
//       "orderItemId": 128836913,
//       "lineItemKey": null,
//       "sku": "DISCOUNT CODE",
//       "name": "10% OFF",
//       "imageUrl": null,
//       "weight": {
//         "value": 0,
//         "units": "ounces"
//       },
//       "quantity": 1,
//       "unitPrice": -20.55,
//       "taxAmount": null,
//       "shippingAmount": null,
//       "warehouseLocation": null,
//       "options": [],
//       "productId": null,
//       "fulfillmentSku": null,
//       "adjustment": true,
//       "upc": null,
//       "createDate": "2015-07-16T14:00:34.823",
//       "modifyDate": "2015-07-16T14:00:34.823"
//     }
//   ],
//   "orderTotal": 194.43,
//   "amountPaid": 218.73,
//   "taxAmount": 5,
//   "shippingAmount": 10,
//   "customerNotes": "Please ship as soon as possible!",
//   "internalNotes": "Customer called and would like to upgrade shipping",
//   "gift": true,
//   "giftMessage": "Thank you!",
//   "paymentMethod": "Credit Card",
//   "requestedShippingService": "Priority Mail",
//   "carrierCode": "fedex",
//   "serviceCode": "fedex_home_delivery",
//   "packageCode": "package",
//   "confirmation": "delivery",
//   "shipDate": "2015-07-02",
//   "holdUntilDate": null,
//   "weight": {
//     "value": 48,
//     "units": "ounces"
//   },
//   "dimensions": {
//     "units": "inches",
//     "length": 7,
//     "width": 5,
//     "height": 6
//   },
//   "insuranceOptions": {
//     "provider": "carrier",
//     "insureShipment": true,
//     "insuredValue": 200
//   },
//   "internationalOptions": {
//     "contents": null,
//     "customsItems": null,
//     "nonDelivery": null
//   },
//   "advancedOptions": {
//     "warehouseId": 24079,
//     "nonMachinable": false,
//     "saturdayDelivery": false,
//     "containsAlcohol": false,
//     "mergedOrSplit": false,
//     "mergedIds": [],
//     "parentId": null,
//     "storeId": 26815,
//     "customField1": "Custom data that you can add to an order. See Custom Field #2 & #3 for more info!",
//     "customField2": "Per UI settings, this information can appear on some carrier's shipping labels. See link below",
//     "customField3": "https://help.shipstation.com/hc/en-us/articles/206639957",
//     "source": "Webstore",
//     "billToParty": null,
//     "billToAccount": null,
//     "billToPostalCode": null,
//     "billToCountryCode": null
//   },
//   "tagIds": null,
//   "userId": null,
//   "externallyFulfilled": false,
//   "externallyFulfilledBy": null,
//   "externallyFulfilledById": 12345,
//   "externallyFulfilledByName": "Example Fulfillment Provider Name"
// }
