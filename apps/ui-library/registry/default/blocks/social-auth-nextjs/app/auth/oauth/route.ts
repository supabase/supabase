import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/server-route'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/'
  }

  if (code) {
    const { supabase, response } = createClient(request)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'

      let redirectUrl: string
      if (isLocalEnv) {
        redirectUrl = `${origin}${next}`
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`
      } else {
        redirectUrl = `${origin}${next}`
      }

      const redirect = NextResponse.redirect(redirectUrl)
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
      response.headers.forEach((value, key) => redirect.headers.set(key, value))
      return redirect
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${new URL(request.url).origin}/auth/error`)
}
