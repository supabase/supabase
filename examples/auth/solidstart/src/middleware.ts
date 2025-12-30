import { createServerClient, parseCookieHeader } from '@supabase/ssr'

export default ({ forward }) => {
  return async (event) => {
    const supabase = createServerClient(
      process.env.PUBLIC_SUPABASE_URL,
      process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return parseCookieHeader(event.request.headers.get('Cookie') ?? '')
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
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

    event.locals.supabase = supabase

    // Helper function to safely get session
    event.locals.safeGetSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        return { session: null, user: null }
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error) {
        // JWT validation has failed
        return { session: null, user: null }
      }

      return { session, user }
    }

    return forward(event)
  }
}
