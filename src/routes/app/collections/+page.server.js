export async function load({ url, locals: { supabase } }) {
  const userId = url.searchParams.get('userId')
  const clientId = url.searchParams.get('clientId')

  if (!userId || !clientId) {
    throw new Error('Missing invoice data')
  }

  // Query Supabase
  const { data, error } = await supabase
    .from('invoice_line_items')
    .select('*') // Select all columns
    .eq('user_id', userId) // Filter by user_id
  // .eq('payment_status', 'Unpaid') // Filter where payment_status is Unpaid

  if (error) {
    console.error('Error fetching invoice line items:', error.message)
    return {
      error: 'Failed to fetch invoice line items.',
    }
  }

  return {
    invoiceLineItems: data,
  }
}
