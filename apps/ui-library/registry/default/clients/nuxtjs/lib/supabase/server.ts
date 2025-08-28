import { createServerClient } from '@supabase/ssr'
import { defineEventHandler, getCookie, setCookie } from 'h3';

export default defineEventHandler(async (event) => {
  // Create Supabase SSR client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        get: (key) => getCookie(event, key),
        set: (key, value, options) => setCookie(event, key, options),
        remove: (key, options) => setCookie(event, key, '', { ...options, maxAge: -1 }),
      },
    }
  );

  // Example: get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Fetch profile row
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return { profile: data };
});
