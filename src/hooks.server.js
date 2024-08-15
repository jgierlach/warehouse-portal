import { createSupabaseServerClient } from "@supabase/auth-helpers-sveltekit";
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
} from "$env/static/public";
import { redirect } from "@sveltejs/kit";

export const handle = async ({ event, resolve }) => {
  // Initialize Supabase server client
  event.locals.supabase = createSupabaseServerClient({
    supabaseUrl: PUBLIC_SUPABASE_URL,
    supabaseKey: PUBLIC_SUPABASE_ANON_KEY,
    event,
  });

  // Helper function to get active session from Supabase
  event.locals.getSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession();

    return session;
  };

  // Handle protected routes e.g /app
  if (event.url.pathname.startsWith("/app")) {
    const session = await event.locals.getSession();
    if (!session) {
      throw redirect(303, "/login");
    }
  }

  // Prevent any api call to /app
  if (
    event.url.pathname.startsWith("/app") &&
    event.request.method === "POST"
  ) {
    const session = await event.locals.getSession();
    if (!session) {
      throw redirect(303, "/app");
    }
  }

  // If user is already logged in, redirect to app
  if (["/", "/login"].includes(event.url.pathname)) {
    const session = await event.locals.getSession();

    if (session) {
      throw redirect(303, "/app");
    }
  }

  return resolve(event);
};
