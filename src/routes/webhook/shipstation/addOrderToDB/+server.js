import { json } from '@sveltejs/kit'
import { findStoreNameBasedOnId, assignClientIdBasedOnStoreName } from '$lib/utils'
import { SEND_GRID_API_KEY } from '$env/static/private'

// Disable CSRF protection for this webhook route
export const config = {
  csrf: false,
}

export async function POST({ request, locals }) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*', // Allow requests from any origin
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const event = await request.json()

    console.log('Webhook received:', event)

    // Check if the event contains a resource_url
    if (!event.resource_url) {
      return json(
        { error: 'Invalid webhook payload: no resource_url provided' },
        { status: 400, headers },
      )
    }

    // Fetch order data from ShipStation using the resource_url
    const response = await fetch(event.resource_url, {
      headers: {
        Authorization: `Basic ${Buffer.from(import.meta.env.VITE_SHIPSTATION_API_KEY + ':' + import.meta.env.VITE_SHIPSTATION_SECRET).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Failed to fetch order data:', response.status, response.statusText)
      return json({ error: 'Failed to fetch order data' }, { status: 500, headers })
    }

    const { orders } = await response.json()
    console.log('Fetched orders', JSON.stringify(orders, null, 2))

    const allShipmentData = []

    // Load all of the stores in ShipStation
    const shipstationStores = await fetch('https://ssapi.shipstation.com/stores', {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(import.meta.env.VITE_SHIPSTATION_API_KEY + ':' + import.meta.env.VITE_SHIPSTATION_SECRET).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })

    // Check if the shipstation stores came back as expected
    if (!shipstationStores.ok) {
      return json(
        { error: 'Failed to fetch ShipStation stores' },
        { status: shipstationStores.status },
      )
    }

    // Process the successful return of ShipStation stores
    const stores = await shipstationStores.json()

    // console.log("STORES PAYLOAD FROM SHIPSTATION", stores)

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
        customerNotes,
        externallyFulfilled,
      } = order

      // Check if order is fulfilled by FBA
      // if (externallyFulfilled) {
      //   console.log("This order is fulfilled by Amazon FBA do not import it.")
      //   return json({ success: true }, { headers });
      // }

      const storeId = advancedOptions?.storeId

      const storeName = findStoreNameBasedOnId(storeId, stores)

      // Check if the webhook is detecting a manual order
      if (storeName === 'Manual Orders') {
        console.log('Exit due to Manual Order source')
        continue
      }

      // Check if the webhook is detecting a Hometown Amazon order
      if (storeName === 'Hometown Amazon') {
        console.log('Do not process order if from Hometown Amazon')
        continue
      }

      // Check if the webhook is detecting a Hometown Amazon order
      if (storeName === 'Hometown Walmart') {
        console.log('Do not process order if from Hometown Walmart')
        continue
      }

      const clientId = assignClientIdBasedOnStoreName(storeName)

      console.log('CLIENT ID', clientId)

      // Loop through each item in the order
      const shipmentData = await Promise.all(
        items.map(async (item) => {
          let sku = item?.sku
          let quantity = item?.quantity
          let imageUrl = item?.imageUrl
          let name = item?.name
          let shipmentNumber = orderNumber

          // Check sku against the sku mapping table
          const { data, error } = await locals.supabase
            .from('sku_mapping')
            .select('*')
            .eq('sku', sku)

          // No sku is found in the sku mapping table that matches
          if (data?.length === 0) {
            console.log('No SKU mapping found for', sku)

            // Insert row into unmapped_skus table
            const unmappedSku = {
              sku,
              client_id: clientId,
              quantity,
              shipment_number: shipmentNumber,
              order_source: storeName,
              name,
              product_image_url: imageUrl,
            }

            const { error: insertError } = await locals.supabase
              .from('unmapped_skus')
              .insert([unmappedSku])

            if (insertError) {
              console.error('Supabase error: inserting into unmapped_skus table', insertError)
            }

            // Send email notification about unmapped SKU
            const endpoint = 'https://api.sendgrid.com/v3/mail/send'
            const emailData = {
              personalizations: [
                {
                  to: [
                    { email: 'jan@hometown-industries.com' },
                    { email: 'storageandfulfillment@hometown-industries.com' },
                    { email: 'wesley@hometown-industries.com' },
                  ],
                  subject: `Sku Value: ${sku} not found in Sku Mapping Table`,
                },
              ],
              from: {
                email: 'storageandfulfillment@hometown-industries.com',
                name: 'Sku Mapping',
              },
              content: [
                {
                  type: 'text/html',
                  value: `
                <p>Sku Value: <strong>${sku}</strong> not found in Sku Mapping table.</p>
                <ul>
                  <li>Product Name: <strong>${name}</strong></li>
                  <li>Quantity: <strong>${quantity}</strong></li>
                  <li>Shipment Number: <strong>${shipmentNumber}</strong></li>
                  <li>Order Source: <strong>${storeName}</strong></li>
                </ul>
                <p>Please navigate to <strong><a href="https://warehouse-portal.vercel.app/app/sku-mapping" target="_blank">Sku Mapping</a></strong> in the warehouse portal and add this sku as a value.</p>
                <p>The shipment number associated with this sku is <strong>${shipmentNumber}</strong></p>`,
                },
              ],
            }
            await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${SEND_GRID_API_KEY}`,
              },
              body: JSON.stringify(emailData),
            })
          }

          // If sku mappings are found execute lookup and deduct inventory quantity from correct product
          if (data?.length > 0) {
            // Calculate total quantity to deduct for THIS specific SKU
            const totalQuantityToDeduct = data.reduce((total, skuMap) => {
              return total + skuMap.quantity_to_deduct * quantity
            }, 0)

            // Fetch the current inventory quantity
            const { data: inventoryData, error: fetchError } = await locals.supabase
              .from('Inventory')
              .select('*')
              .eq('id', data[0].product_id)
              .single()

            if (fetchError) {
              console.error(
                `Error fetching inventory for product_id ${data[0].product_id}:`,
                fetchError,
              )
            }

            if (!inventoryData) {
              console.warn(`No inventory found for product_id ${data[0].product_id}`)
            }

            const currentQuantity = inventoryData?.Quantity
            const newQuantity = Math.max(0, currentQuantity - totalQuantityToDeduct) // Prevent negative values

            // Update the inventory changelog table
            const log = {
              client_id: clientId,
              shipment_number: shipmentNumber,
              change_source: storeName,
              name: item?.name,
              asin: item?.upc,
              sku,
              previous_quantity: currentQuantity,
              new_quantity: newQuantity,
              previous_pending: 0,
              new_pending: 0,
            }

            const { error: logError } = await locals.supabase
              .from('inventory_changelog')
              .insert([log])

            if (logError) {
              console.error('Supabase error: inserting into inventory_changelog table', logError)
            }

            // Deduct the appropriate quantities from the inventory table
            const { error: updateError } = await locals.supabase
              .from('Inventory')
              .update({ Quantity: newQuantity })
              .eq('id', data[0].product_id)

            if (updateError) {
              console.error(
                `Error updating inventory for product_id ${data[0].product_id}:`,
                updateError,
              )
            } else {
              console.log(
                `Successfully updated inventory for product_id ${data[0].product_id}. New quantity: ${newQuantity}`,
              )
            }
          }

          // Check if error is returned from Supabase
          if (error) {
            console.error('Supabase Error: fetching sku mapping:', error)
          }

          return {
            Client_Id: clientId || null,
            Shipment_Number: orderNumber || null,
            Carrier: carrierCode || null,
            Tracking_Number: trackingNumber || null,
            PO_Number: orderNumber || null,
            Destination: storeName || null,
            Requires_Amazon_Labeling: 'No',
            Shipment_Type: 'Outbound', // Default or map from payload if available
            Status: 'Pending', // Set a default status
            Date_Of_Last_Change: orderDate || null,
            Asin: item.upc || null, // Using UPC as a proxy for ASIN in the payload
            Product_Title: item.name || null, // Title of the product (SKU)
            Sku: item.sku || null, // SKU for the product
            Product_Image_Url: item.imageUrl || null, // Image URL if available
            Quantity: item.quantity || 1, // Quantity of the current item
            Buyer_Name: shipTo?.name || null,
            Buyer_Email: customerEmail || null,
            Recipient_Name: shipTo?.name || null,
            Recipient_Company: shipTo?.company || null,
            Recipient_Address_Line_1: shipTo?.street1 || null,
            Recipient_City: shipTo?.city || null,
            Recipient_State: shipTo?.state || null,
            Recipient_Postal_Code: shipTo?.postalCode || null,
            Recipient_Country: shipTo?.country || null,
            Notes: customerNotes || null, // Any internal notes provided
            Cost_Of_Shipment: null,
          }
        }),
      )

      allShipmentData.push(...shipmentData)
    }

    console.log('All Shipment Data:', JSON.stringify(allShipmentData, null, 2))

    // Insert all shipment data into the database
    const { data, error } = await locals.supabase.from('Outbound_Shipments').insert(allShipmentData)

    console.log('Insert result:', allShipmentData, data, error)

    if (error) {
      console.error('Error inserting shipment data:', error)
      return json({ error: 'Failed to process shipment' }, { status: 500, headers })
    }

    return json({ success: true }, { headers })
  } catch (err) {
    console.error('Error processing webhook:', err)
    return json({ error: 'Invalid request' }, { status: 400, headers })
  }
}

// Handle CORS preflight requests
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

// const FetchedOrders = [
//   {
//     "orderId": 472630237,
//     "orderNumber": "KDNEK3WKRK",
//     "orderKey": "bo_kdnek3wkrk",
//     "orderDate": "2023-09-18T08:56:16.0000000",
//     "createDate": "2024-09-20T11:49:10.9530000",
//     "modifyDate": "2024-09-20T11:49:11.8930000",
//     "paymentDate": "2023-09-25T11:54:00.0000000",
//     "shipByDate": null,
//     "orderStatus": "shipped",
//     "customerId": 233053031,
//     "customerUsername": "SUMMER.SOLACE",
//     "customerEmail": null,
//     "billTo": {
//       "name": "SUMMER SOLACE",
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
//       "name": "MEGAN BRE CAMP",
//       "company": "SUMMER SOLACE",
//       "street1": "5507 SHATTUCK AVE",
//       "street2": "",
//       "street3": null,
//       "city": "OAKLAND",
//       "state": "CA",
//       "postalCode": "94609-1621",
//       "country": "US",
//       "phone": "5107721496",
//       "residential": false,
//       "addressVerified": "Address validated successfully"
//     },
//     "items": [
//       {
//         "orderItemId": 788607839,
//         "lineItemKey": null,
//         "sku": "860008498144",
//         "name": "New! Organic Elderberry Extract Unsweetened",
//         "imageUrl": null,
//         "weight": null,
//         "quantity": 6,
//         "unitPrice": 20,
//         "taxAmount": 0,
//         "shippingAmount": 0,
//         "warehouseLocation": null,
//         "options": [],
//         "productId": 38369089,
//         "fulfillmentSku": null,
//         "adjustment": false,
//         "upc": null,
//         "createDate": "2024-09-20T11:49:10.923",
//         "modifyDate": "2024-09-20T11:49:10.923"
//       }
//     ],
//     "orderTotal": 120,
//     "amountPaid": 0,
//     "taxAmount": 0,
//     "shippingAmount": 0,
//     "customerNotes": null,
//     "internalNotes": null,
//     "gift": false,
//     "giftMessage": null,
//     "paymentMethod": null,
//     "requestedShippingService": null,
//     "carrierCode": null,
//     "serviceCode": null,
//     "packageCode": null,
//     "confirmation": "none",
//     "shipDate": null,
//     "holdUntilDate": null,
//     "weight": {
//       "value": 0,
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
//       "storeId": 809765,
//       "customField1": null,
//       "customField2": null,
//       "customField3": null,
//       "source": "faire",
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

// const orders = [
//   {
//     "orderId": 471433898,
//     "orderNumber": "11242",
//     "orderKey": "96f893ca-7416-49ed-a01c-335aa716ddeb",
//     "orderDate": "2024-09-17T19:36:17.2100000",
//     "createDate": "2024-09-17T13:29:45.0530000",
//     "modifyDate": "2024-09-17T13:29:46.1770000",
//     "paymentDate": "2024-09-17T19:36:19.9900000",
//     "shipByDate": null,
//     "orderStatus": "awaiting_shipment",
//     "customerId": 221414228,
//     "customerUsername": "dhcarr88@gmail.com",
//     "customerEmail": "dhcarr88@gmail.com",
//     "billTo": {
//       "name": "David Carr",
//       "company": null,
//       "street1": "4510A Illinois Ave",
//       "street2": null,
//       "street3": null,
//       "city": "Nashville",
//       "state": "TN",
//       "postalCode": "37209-2304",
//       "country": "US",
//       "phone": "5047155350",
//       "residential": null,
//       "addressVerified": null
//     },
//     "shipTo": {
//       "name": "David Carr",
//       "company": null,
//       "street1": "4510A ILLINOIS AVE",
//       "street2": "",
//       "street3": null,
//       "city": "NASHVILLE",
//       "state": "TN",
//       "postalCode": "37209-2304",
//       "country": "US",
//       "phone": "5047155350",
//       "residential": true,
//       "addressVerified": "Address validated successfully"
//     },
//     "items": [
//       {
//         "orderItemId": 786353947,
//         "lineItemKey": "1",
//         "sku": "GF1GS30CAN",
//         "name": "Ballast Electrolyte Drink Mix | Keto & Paleo Friendly (Grapefruit)",
//         "imageUrl": "https://static.wixstatic.com/media/201502_cc4afcf9ddbc4f319ec31803231c09b9~mv2.jpg/v1/fit/w_6000,h_4000,q_90/file.jpg",
//         "weight": {
//           "value": 9.6,
//           "units": "ounces",
//           "WeightUnits": 1
//         },
//         "quantity": 1,
//         "unitPrice": 14.99,
//         "taxAmount": 1.46,
//         "shippingAmount": null,
//         "warehouseLocation": null,
//         "options": [],
//         "productId": 30553028,
//         "fulfillmentSku": null,
//         "adjustment": false,
//         "upc": null,
//         "createDate": "2024-09-17T13:29:44.81",
//         "modifyDate": "2024-09-17T13:29:44.81"
//       }
//     ],
//     "orderTotal": 16.45,
//     "amountPaid": 16.45,
//     "taxAmount": 1.46,
//     "shippingAmount": 0,
//     "customerNotes": null,
//     "internalNotes": null,
//     "gift": false,
//     "giftMessage": null,
//     "paymentMethod": "Square",
//     "requestedShippingService": "Free Shipping 3-5 Business Days",
//     "carrierCode": null,
//     "serviceCode": null,
//     "packageCode": null,
//     "confirmation": "none",
//     "shipDate": null,
//     "holdUntilDate": null,
//     "weight": {
//       "value": 9.6,
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
//       "storeId": 788753,
//       "customField1": null,
//       "customField2": null,
//       "customField3": null,
//       "source": "WEB",
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
//         "name": "Dixie Belle Synthetic Flat Small Paint Brush | 1" Quality Synthetic Smooth Release Bristles | Professional Grade Paint Brush | Made in The USA",
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
