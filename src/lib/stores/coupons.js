import { writable } from 'svelte/store'

/** @type {import('svelte/store').Writable<Array<any>>} */
export const coupons = writable([])

/**
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns
 */
export const loadCoupons = async (supabase) => {
  const { data, error } = await supabase.from('coupons').select('*')

  if (error) {
    console.error(error)
    return
  }

  coupons.set(data)
}
