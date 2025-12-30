// SolidStart middleware for Supabase SSR authentication
// This demonstrates the concept of session synchronization and safe client creation

import { createServerClient, parseCookieHeader } from '@supabase/ssr'

export default function supabaseMiddleware({ forward }: any) {
  return async (event: any) => {
    // Create Supabase server client with proper cookie handling
    const supabase = createServerClient(
      process.env.PUBLIC_SUPABASE_URL || '',
      process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
      {
        cookies: {
          getAll() {
            return parseCookieHeader(event.request.headers.get('Cookie') ?? '')
          },
          setAll(cookiesToSet: any[]) {
            cookiesToSet.forEach(({ name, value, options }: any) => {
              event.response.headers.set(
                'Set-Cookie',
                `${name}=${value}; ${Object.entries(options)
                  .map(([key, value]) => `${key}=${value}`)
                  .join('; ')}`
              )
            })
          },
        },
      }
    )

    // Attach to event locals for use in routes
    event.locals = event.locals || {}
    event.locals.supabase = supabase

    // Safe session validation helper
    event.locals.safeGetSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return { session: null, user: null }
      }

      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        return { session: null, user: null }
      }

      return { session, user }
    }

    return forward(event)
  }
}