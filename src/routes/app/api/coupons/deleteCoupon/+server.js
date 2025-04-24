import { json, error } from '@sveltejs/kit'

export async function DELETE({ request, locals }) {
  try {
    const { id } = await request.json()

    if (!id) {
      throw error(400, 'Missing id in request body')
    }

    const { error: deleteError } = await locals.supabase.from('coupons').delete().eq('id', id)

    if (deleteError) {
      console.error('Supabase delete error:', deleteError)
      throw error(500, 'Failed to delete coupon')
    }

    return json({ message: 'coupon was deleted successfully' })
  } catch (err) {
    console.error('Unexpected error:', err)
    throw error(500, 'An unexpected error occurred')
  }
}
