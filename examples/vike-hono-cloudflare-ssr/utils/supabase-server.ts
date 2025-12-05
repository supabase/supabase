import { createServerClient, parseCookieHeader } from '@supabase/ssr'

// For use in Vike page hooks and components
export function createSupabaseServerClient(request: Request, responseHeaders: Headers) {
  return createServerClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get('Cookie') ?? '')
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookie = serializeCookieHeader(name, value, options)
            responseHeaders.append('Set-Cookie', cookie)
          })
        },
      },
    }
  )
}

// Utility function for serializing cookies
function serializeCookieHeader(name: string, value: string, options: any = {}) {
  let cookie = `${name}=${value}`
  
  if (options.maxAge) cookie += `; Max-Age=${options.maxAge}`
  if (options.domain) cookie += `; Domain=${options.domain}`
  if (options.path) cookie += `; Path=${options.path}`
  if (options.secure) cookie += '; Secure'
  if (options.httpOnly) cookie += '; HttpOnly'
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`
  
  return cookie
}
