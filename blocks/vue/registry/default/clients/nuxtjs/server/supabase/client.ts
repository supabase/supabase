import { createServerClient } from '@supabase/ssr'
import { getCookie, setCookie, deleteCookie, H3Event, EventHandlerRequest } from 'h3'

export const createSupabaseServerClient = (event: H3Event<EventHandlerRequest> | undefined) => {
  return createServerClient(
    process.env.NUXT_PUBLIC_SUPABASE_URL!,
    process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        get: (key) => getCookie(event!, key),
        set: (key, value, options) => setCookie(event!, key, value, options),
        remove: (key, options) => deleteCookie(event!, key, options),
      },
    }
  )
}