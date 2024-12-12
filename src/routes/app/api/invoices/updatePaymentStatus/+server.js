import { json } from '@sveltejs/kit'

export async function PUT({ request, locals }) {
  const { paymentStatus, lineItemId } = await request.json()

  console.log('Payment Status', paymentStatus)

  const row = {
    payment_status: paymentStatus,
  }

  const { data, error } = await locals.supabase
    .from('invoice_line_items')
    .update(row)
    .eq('id', lineItemId)
    .select()

  if (error) {
    console.error('Failed to insert invoice line items', error)
    return json({ status: 500, body: { message: 'Failed to insert invoice line items.' } })
  }

  return json({
    status: 200,
    body: { message: 'Invoice line items created!' },
  })
}
