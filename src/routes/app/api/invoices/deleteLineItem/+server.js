import fetch from 'node-fetch'
import { json } from '@sveltejs/kit'

export async function DELETE({ request, locals }) {
  const { id } = await request.json()

  const { error } = await locals.supabase.from('invoice_line_items').delete().eq('id', id)

  if (error) {
    console.error(error)
  }

  return json({
    status: 200,
    body: { message: 'Invoice line item was deleted!' },
  })
}
