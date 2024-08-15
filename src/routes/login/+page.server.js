import { fail, redirect } from "@sveltejs/kit";

export const actions = {
  default: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const email = formData.get("email");
    const password = formData.get("password");

    // SignIn supabase
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      return fail(400, {
        message: "Invalid email or password",
        email,
        success: false,
      });
    }

    throw redirect(303, "/");
  },
};
