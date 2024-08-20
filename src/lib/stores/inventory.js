import { writable } from "svelte/store";

export const inventory = writable([]);

/**
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns
 */
export const loadInventory = async (supabase) => {
  const { data, error } = await supabase.from("Inventory").select("*").order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  inventory.set(data);
};
