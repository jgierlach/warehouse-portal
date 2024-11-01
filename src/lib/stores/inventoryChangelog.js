import { writable } from "svelte/store";

export const inventoryChangelog = writable([]);

/**
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns
 */
export const loadInventoryChangelog = async (supabase) => {
  const { data, error } = await supabase.from("inventory_changelog").select("*").order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  inventoryChangelog.set(data);
};
