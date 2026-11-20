import { createServerFn } from '@solidjs/start'
import { createServerClient } from '@supabase/ssr'
import { parseCookieHeader } from '@supabase/ssr'

/**
 * Server function that validates the session and returns the current user.
 *
 * SolidStart server$ functions run only on the server. They have access to
 * Request via SolidStart's server context, which we use to read cookies and
 * construct a Supabase server client.
 *
 * This is the recommended pattern for protected data loading in SolidStart:
 * keep the Supabase server client creation inside the server function so it
 * never leaks into the client bundle.
 */
export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  // In SolidStart v1, server$ contexts expose `request` via the global
  // solid server context. We read cookies from it.
  const request = (globalThis as any).server?.request
  const cookieHeader = request?.headers?.get('Cookie') ?? ''

  const supabase = createServerClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(cookieHeader) as { name: string; value: string }[]
        },
        setAll() {
          // Cookie mutations in server$ functions are not automatically
          // persisted — this example focuses on read-only session checks.
          // For full session sync, use the middleware pattern in server.ts.
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return {
    user: user
      ? {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name ?? null,
        }
      : null,
  }
})
