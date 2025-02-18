import { json, error } from '@sveltejs/kit'

export async function DELETE({ request, locals }) {
  try {
    const { id } = await request.json()

    if (!id) {
      return json({ message: 'Missing id in request body.' }, { status: 400 })
    }

    const { error: deleteError } = await locals.supabase.from('sku_mapping').delete().eq('id', id)

    if (deleteError) {
      console.error('Supabase delete error:', deleteError)
      return json(
        { message: 'SKU mapping failed to delete.', error: deleteError.message },
        { status: 500 },
      )
    }

    return json({ message: 'Sku mapping was deleted successfully' })
  } catch (err) {
    console.error('Unexpected error:', err)
    return json({ message: 'Internal server error.' }, { status: 500 })
  }
}
