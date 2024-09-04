import fetch from 'node-fetch';
import { json } from '@sveltejs/kit';

export async function PUT({ request, locals }) {
  const {
    id,              // Shipment ID
    countedQuantity,  // Counted quantity for the shipment
  } = await request.json();

  // Log the incoming data
  console.log("COUNTED QUANTITY ON SERVER", countedQuantity);
  console.log("ID", id);

  // Fetch the shipment details, including the Inventory_Id
  const { data: shipmentData, error: shipmentError } = await locals.supabase
    .from('Inbound_Shipments')
    .select('Inventory_Id, Counted_Quantity')
    .eq('id', id)
    .single();  // Get the single record that matches the shipment ID

  if (shipmentError || !shipmentData) {
    console.error("Error fetching shipment:", shipmentError);
    return json({ status: 400, body: { message: 'Failed to fetch shipment data' } });
  }

  const { Inventory_Id } = shipmentData; // Extract the Inventory_Id from the shipment

  // Proceed with updating the Inbound_Shipments table with the new count
  const row = {
    id: id,
    Counted_Quantity: countedQuantity,
    Status: "Received",
  };

  const { data: updateShipmentData, error: updateShipmentError } = await locals.supabase
    .from('Inbound_Shipments')
    .update(row)
    .eq('id', id)
    .select();

  if (updateShipmentError) {
    console.error("Error updating shipment:", updateShipmentError);
    return json({ status: 400, body: { message: 'Failed to update shipment count' } });
  }

  // Now, update the Inventory table using Inventory_Id
  const { data: inventoryData, error: inventoryError } = await locals.supabase
    .from('Inventory')
    .select('Pending, Quantity')
    .eq('id', Inventory_Id)
    .single();

  if (inventoryError || !inventoryData) {
    console.error("Error fetching inventory:", inventoryError);
    return json({ status: 400, body: { message: 'Failed to fetch inventory data' } });
  }

  // Calculate the new values for Pending and Quantity
  const newPending = inventoryData.Pending - countedQuantity;
  const newQuantity = inventoryData.Quantity + countedQuantity;

  // Update the inventory row with the new values
  const { error: updateInventoryError } = await locals.supabase
    .from('Inventory')
    .update({
      Pending: newPending,
      Quantity: newQuantity,
    })
    .eq('id', Inventory_Id);

  if (updateInventoryError) {
    console.error("Error updating inventory:", updateInventoryError);
    return json({ status: 400, body: { message: 'Failed to update inventory' } });
  }

  // Return success message
  return json({
    status: 200,
    body: { message: 'Product count was confirmed and inventory updated' },
  });
}


// import fetch from 'node-fetch';
// import { json } from '@sveltejs/kit';

// export async function PUT({ request, locals }) {
//   const {
//     id,
//     countedQuantity,
//   } = await request.json();

//   console.log("COUNTED QUANTITY ON SERVER", countedQuantity)
//   console.log("ID", id)

//   const row = {
//     id: id,
//     Counted_Quantity: countedQuantity,
//     Status: "Received"
//   };

//   const { data, error } = await locals.supabase
//     .from('Inbound_Shipments')
//     .update(row)
//     .eq('id', id)
//     .select();

//   if (error) {
//     console.error(error);
//   }

//   return json({
//     status: 200,
//     body: { message: 'Product count was confirmed' },
//   });
// }
