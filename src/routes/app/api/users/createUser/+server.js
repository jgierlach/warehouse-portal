import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

export async function POST({ request }) {
  // Parse the incoming request to get the user data
  const { username, password, company_name, isadmin, isclient, hasLotNumbers, per_order_fee, per_order_unit_fee, per_unit_fba_pack_prep, per_unit_wfs_pack_prep, b2b_freight_percentage_markup } = await request.json();

  // Initialize Supabase client with service role key
  const supabaseAdmin = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const email = username
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      console.error('Error creating user in auth:', authError);
      throw new Error('Failed to create user in auth.');
    }

    // Insert the user into your custom `users` table
    const { error: userError } = await supabaseAdmin.from('users').insert([
      {
        id: authData.user.id, // Use the ID from the auth table
        company_name,
        username,
        password,
        isadmin,
        isclient,
        has_lot_numbers: hasLotNumbers,
        per_order_fee,
        per_order_unit_fee,
        per_unit_fba_pack_prep,
        per_unit_wfs_pack_prep,
        b2b_freight_percentage_markup
      }
    ]);

    if (userError) {
      console.error('Error inserting user into users table:', userError);
      throw new Error('Failed to insert user into users table.');
    }

    // Return a successful response
    return json({
      status: 201,
      body: { message: 'User created successfully!' }
    });
  } catch (error) {
    console.error('Error during user creation:', error);
    return json({
      status: 500,
      body: { message: error.message }
    });
  }
}
