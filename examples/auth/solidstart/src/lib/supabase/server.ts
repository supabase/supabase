import { createServerClient } from '@supabase/ssr'
import { getCookie, getHeader, setCookie } from 'vinxi/http'
import { getSupabaseConfig } from './config'

/**
 * Creates a Supabase client for server-side usage with cookie-based session management.
 *
 * This client is designed for server-side code (route loaders, actions, API handlers).
 * It uses Vinxi's HTTP utilities to read and write cookies for session management.
 *
 * Important: Must be called within a request context (inside loaders/actions with "use server").
 * Creates a fresh client per request to ensure proper session isolation between users.
 *
 * Cookie handling:
 * - getAll(): Parses cookies from the request's Cookie header
 * - setAll(): Writes cookies to the response via Vinxi's setCookie
 *
 * @returns Supabase client configured for server-side usage with cookie adapter
 *
 * @example
 * ```ts
 * const getUser = cache(async () => {
 *   'use server'
 *   const supabase = getSupabaseServerClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *   return user
 * }, 'user')
 * ```
 */
export function getSupabaseServerClient() {
  const { url, anonKey } = getSupabaseConfig()
  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          // Parse cookies from the Cookie header
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
}
