import { writable } from "svelte/store";

export const outboundShipments = writable([]);

/**
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns
 */
export const loadOutboundShipments = async (supabase) => {
  const { data, error } = await supabase.from("Outbound_Shipments").select("*").order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  outboundShipments.set(data);
};
