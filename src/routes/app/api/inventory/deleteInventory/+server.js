import fetch from 'node-fetch';
import { json } from '@sveltejs/kit';

export async function DELETE({ request, locals }) {
  const { id, createdAt } =
    await request.json();

  const { error } = await locals.supabase
    .from('Inventory')
    .delete()
    .eq('id', id)
    .eq('created_at', createdAt)

  if (error) {
    console.error(error);
  }

  return json({
    status: 200,
    body: { message: 'Inventory was deleted!' },
  });
}
