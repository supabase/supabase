import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie, setResponseHeader } from '@tanstack/react-start/server'

export function createClient() {
  return createServerClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(getCookies()).map(
            ([name, value]) =>
              ({
                name,
                value,
              }) as { name: string; value: string }
          )
        },
        setAll(cookies, headers) {
          cookies.forEach((cookie) => {
            setCookie(cookie.name, cookie.value)
          })
          Object.entries(headers).forEach(([key, value]) => setResponseHeader(key as any, value))
        },
      },
    }
  )
}
