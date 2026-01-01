import { createServerClient } from '@supabase/ssr'
import { getCookie, getHeader, setCookie } from 'vinxi/http'
import { getSupabaseConfig } from './config'

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
