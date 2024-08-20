import { writable } from "svelte/store";

export const inboundShipments = writable([]);

/**
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns
 */
export const loadInboundShipments = async (supabase) => {
  const { data, error } = await supabase.from("Inbound_Shipments").select("*").order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  inboundShipments.set(data);
};
