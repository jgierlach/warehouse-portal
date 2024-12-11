import { writable } from 'svelte/store'

export const invoiceLineItems = writable([])

/**
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns
 */
export const loadInvoiceLineItems = async (supabase) => {
  const { data, error } = await supabase
    .from('invoice_line_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return
  }

  invoiceLineItems.set(data)
}
