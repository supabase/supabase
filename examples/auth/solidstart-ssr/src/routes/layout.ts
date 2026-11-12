import { createServerFn } from '@solidjs/start'
import { createServerClient, parseCookieHeader } from '@supabase/ssr'

/**
 * Server-side loader for the root layout.
 *
 * Demonstrates the recommended pattern for SolidStart + Supabase SSR:
 * the Supabase server client is created exclusively in server$ functions,
 * using cookie data from the incoming Request. The resulting session data
 * is serialized and injected into the layout props, keeping all sensitive
 * server-only code out of the client bundle.
 */
export const layoutLoad = createServerFn({ method: 'GET' }).handler(async () => {
  // SolidStart v1 exposes the current Request on the global server context.
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
          // setAll is a no-op here because we're in a server$ function,
          // not middleware. For cookie writes, use src/server.ts.
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
