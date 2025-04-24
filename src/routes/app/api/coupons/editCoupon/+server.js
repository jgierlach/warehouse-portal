import { json } from '@sveltejs/kit'

export async function PUT({ request, locals }) {
  try {
    const { client_id, name, id } = await request.json()

    const coupon = {
      client_id,
      name,
    }

    const { data, error } = await locals.supabase
      .from('coupons')
      .update(coupon)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase editing coupon error', error)
      return json({
        status: 500,
        body: { message: 'Failed to edit coupon', error },
      })
    }

    return json({
      status: 200,
      body: { message: 'Coupon was edited' },
    })
  } catch (err) {
    console.error('Server error editing coupon ', err)
    return json({ message: 'Error editing coupon', error: err?.message }, { status: 500 })
  }
}
