import { writable } from 'svelte/store'

export const skuMapping = writable([])

/**
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns
 */
export const loadSkuMapping = async (supabase) => {
  const { data, error } = await supabase
    .from('sku_mapping')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return
  }

  skuMapping.set(data)
}
