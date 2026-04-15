import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/server-route'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const _next = searchParams.get('next')
  const next = _next?.startsWith('/') ? _next : '/'

  if (token_hash && type) {
    const { supabase, response } = createClient(request)

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      const redirect = NextResponse.redirect(`${origin}${next}`)
      redirect.cookies.setAll(response.cookies.getAll())
      response.headers.forEach((value, key) => redirect.headers.set(key, value))
      return redirect
    } else {
      const redirect = NextResponse.redirect(`${origin}/auth/error?error=${error?.message}`)
      redirect.cookies.setAll(response.cookies.getAll())
      response.headers.forEach((value, key) => redirect.headers.set(key, value))
      return redirect
    }
  }

  return NextResponse.redirect(
    `${new URL(request.url).origin}/auth/error?error=No token hash or type`
  )
}
