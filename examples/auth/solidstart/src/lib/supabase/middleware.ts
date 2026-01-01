import { createServerClient } from '@supabase/ssr'
import { getHeader, setCookie } from 'vinxi/http'
import { getSupabaseConfig } from './config'

/**
 * Updates and refreshes the user's Supabase session.
 *
 * This function should be called from middleware on every request to ensure
 * authentication tokens are refreshed before route handlers execute.
 *
 * Behavior:
 * - Reads session from request cookies
 * - Validates JWT and refreshes if expired
 * - Writes updated session back to response cookies
 * - Returns configured Supabase client for further use
 *
 * Note: Calling getUser() triggers automatic token refresh via @supabase/ssr.
 * The setAll() callback is invoked when tokens are refreshed, updating cookies.
 *
 * @returns Promise resolving to configured Supabase server client
 *
 * @example
 * ```ts
 * // src/middleware.ts
 * import { updateSession } from '~/lib/supabase/middleware'
 *
 * export default createMiddleware({
 *   onRequest: [
 *     async (event) => {
 *       await updateSession()
 *     }
 *   ]
 * })
 * ```
 */
export async function updateSession() {
  const { url, anonKey } = getSupabaseConfig()
  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          const cookieHeader = getHeader('Cookie') ?? ''
          return cookieHeader
            .split(';')
            .map((cookie) => {
              const [name, ...rest] = cookie.trim().split('=')
              return { name, value: rest.join('=') }
            })
            .filter((cookie) => cookie.name)
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            setCookie(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser()

  return supabase
}
