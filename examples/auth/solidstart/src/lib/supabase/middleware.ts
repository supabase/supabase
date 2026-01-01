import { createServerClient } from '@supabase/ssr'
import { getCookie, getHeader, setCookie } from 'vinxi/http'

export async function updateSession() {
  const supabase = createServerClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
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
