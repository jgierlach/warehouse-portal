import { writable } from 'svelte/store'

/** @type {import('svelte/store').Writable<Array<any>>} */
export const clients = writable([])

/**
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns
 */
export const loadClients = async (supabase) => {
  const { data, error } = await supabase.from('users').select('*')

  if (error) {
    console.error(error)
    return
  }

  clients.set(data)
}
