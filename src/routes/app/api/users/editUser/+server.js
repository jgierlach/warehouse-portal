import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

export async function PUT({ request }) {
  const { id, hasLotNumbers, per_order_fee, per_order_unit_fee, per_unit_fba_pack_prep, per_unit_wfs_pack_prep, b2b_freight_percentage_markup } = await request.json();

  // Initialize Supabase client with service role key
  const supabaseAdmin = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Update the user in your custom `users` table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        has_lot_numbers: hasLotNumbers,
        per_order_fee,
        per_order_unit_fee,
        per_unit_fba_pack_prep,
        per_unit_wfs_pack_prep,
        b2b_freight_percentage_markup
      })
      .eq('id', id);

    if (userError) {
      console.error('Error updating user in users table:', userError);
      throw new Error('Failed to update user in users table.');
    }

    return json({
      status: 200,
      body: { message: 'User updated successfully!' }
    });
  } catch (error) {
    console.error('Error during user update:', error);
    return json({
      status: 500,
      body: { message: error.message }
    });
  }
}