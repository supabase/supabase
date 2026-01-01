import { createServerClient } from '@supabase/ssr'
import { getHeader, setCookie } from 'vinxi/http'
import { getSupabaseConfig } from './config'

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
