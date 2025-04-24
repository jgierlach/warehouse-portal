import { json } from '@sveltejs/kit'

export async function POST({ request, locals }) {
  try {
    const { client_id, name } = await request.json()

    const coupon = {
      client_id,
      name,
    }

    const { data, error } = await locals.supabase.from('coupons').insert([coupon]).select()

    if (error) {
      console.error('Supabase Insert Error:', error)
      return json({ message: 'Coupon creation failed.', error: error.message }, { status: 500 })
    }

    return json({ message: 'New Coupon was created!', data }, { status: 201 })
  } catch (err) {
    console.error('Server Error:', err)
    return json({ message: 'Internal server error.' }, { status: 500 })
  }
}
