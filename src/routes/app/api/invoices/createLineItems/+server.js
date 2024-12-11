import { json } from '@sveltejs/kit'

export async function POST({ request, locals }) {
  const { formattedLineItems } = await request.json()

  console.log('FORMATTED LINE ITEMS', formattedLineItems)

  const { data, error } = await locals.supabase
    .from('invoice_line_items')
    .insert(formattedLineItems)
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
