import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const _next = searchParams.get('next')
  // only follow local paths or same-origin URLs to prevent open redirects
  const isLocalPath = (path: string) =>
    path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\')
  let next = '/'
  if (_next) {
    if (isLocalPath(_next)) {
      next = _next
    } else {
      try {
        const nextUrl = new URL(_next)
        const candidate = nextUrl.pathname + nextUrl.search + nextUrl.hash
        // same-origin URLs can still carry a protocol-relative path: https://app.com//evil.com
        if (nextUrl.origin === origin && isLocalPath(candidate)) {
          next = candidate
        }
      } catch {
        // not a valid URL, keep the default
      }
    }
  }

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // redirect user to specified redirect URL or root of app
      redirect(next)
    } else {
      // redirect the user to an error page with some instructions
      redirect(`/auth/error?error=${encodeURIComponent(error.message)}`)
    }
  }

  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=${encodeURIComponent('No token hash or type')}`)
}
