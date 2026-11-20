import {
  createBrowserClient,
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
} from '@supabase/ssr'

/**
 * Creates a Supabase server-side client for SolidStart middleware.
 *
 * Unlike Next.js (which uses NextRequest/NextResponse) or SvelteKit (which
 * exposes event.cookies), SolidStart's middleware works with standard Web
 * platform Request/Response objects. This helper bridges that gap by:
 *
 * 1. Parsing cookies from the incoming Request's Cookie header
 * 2. Providing a setAll callback that mutates a cookie jar, which is then
 *    serialized into Set-Cookie headers on the outgoing Response
 *
 * Usage in src/server.ts:
 *
 *   export default defineServer((event) => {
 *     const response = await event.next()
 *     // pass response through, middleware is for observation in this example
 *   })
 *
 * For a full session-sync pattern, wrap responses to inject Set-Cookie headers.
 */
export function createSupabaseServerClient(request: Request) {
  const headers = new Headers()
  const cookieStore = new Map<string, { value: string; options: any }>()

  const supabase = createServerClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get('Cookie') ?? '') as {
            name: string
            value: string
          }[]
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, { value, options })
          })
        },
      },
    }
  )

  /**
   * Applies any cookie changes accumulated during request handling onto the
   * outgoing Response. Call this before returning from middleware or server
   * functions to persist auth sessions.
   */
  function applyCookies(response: Response): Response {
    if (cookieStore.size === 0) return response

    const merged = new Headers(response.headers)
    cookieStore.forEach(({ value, options }, name) => {
      merged.append('Set-Cookie', serializeCookieHeader(name, value, options))
    })

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: merged,
    })
  }

  return { supabase, applyCookies, headers }
}

/**
 * Creates a browser-side Supabase client. Safe to call in components and
 * client-only code paths. Do NOT use this inside server functions or SSR
 * loaders — use createSupabaseServerClient there instead.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  )
}
