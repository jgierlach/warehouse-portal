import { writable, get } from 'svelte/store'

/** @type {import('svelte/store').Writable<Array<any>>} */
export const inboundShipments = writable([])
/** @type {import('svelte/store').Writable<number>} */
export const totalInboundShipmentCount = writable(0)
/** @type {import('svelte/store').Writable<number>} */
export const currentPage = writable(1)
/** @type {import('svelte/store').Writable<number>} */
export const pageSize = writable(50)
/** @type {import('svelte/store').Writable<string>} */
export const searchQuery = writable('')

/**
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns
 */
export const loadInboundShipments = async (supabase) => {
  const currentPageValue = get(currentPage)
  const pageSizeValue = get(pageSize)
  const searchQueryValue = get(searchQuery)
  const start = (currentPageValue - 1) * pageSizeValue
  const end = start + pageSizeValue - 1

  console.log('loadInboundShipments called with:', {
    currentPage: currentPageValue,
    pageSize: pageSizeValue,
    start,
    end,
    searchQuery: searchQueryValue,
  })

  try {
    // First get the total count
    let countQuery = supabase.from('Inbound_Shipments').select('*', { count: 'exact', head: true })

    // Add search filter if there's a search query
    if (searchQueryValue) {
      countQuery = countQuery.ilike('Shipment_Number', `%${searchQueryValue}%`)
    }

    console.log('Executing count query...')
    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Count error:', countError)
      return
    }

    console.log('Raw count from database:', count)
    totalInboundShipmentCount.set(count || 0)

    // Then get the paginated data
    let dataQuery = supabase
      .from('Inbound_Shipments')
      .select('*')
      .order('created_at', { ascending: false })

    // Add search filter if there's a search query
    if (searchQueryValue) {
      dataQuery = dataQuery.ilike('Shipment_Number', `%${searchQueryValue}%`)
    }

    console.log('Executing data query with range:', start, end)
    const { data, error } = await dataQuery.range(start, end)

    if (error) {
      console.error('Data error:', error)
      return
    }

    console.log('Data length:', data?.length)
    console.log('Current page after query:', get(currentPage))
    console.log('Current page size after query:', get(pageSize))
    console.log('Total count after query:', get(totalInboundShipmentCount))
    inboundShipments.set(data || [])
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}
