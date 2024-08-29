import { json } from '@sveltejs/kit';

export async function GET({ locals }) {
  try {
    const { data, error } = await locals.supabase.from("users").select("*");

    if (error) {
      console.error(error);
      return json({
        status: 500,
        body: { message: 'Error fetching users', error: error.message }
      });
    }

    // Return a successful response with the users data
    return json({
      status: 200,
      body: { message: 'All users fetched successfully', users: data }
    });
  } catch (error) {
    console.error('Error during fetching users', error);
    return json({
      status: 500,
      body: { message: error.message }
    });
  }
}
