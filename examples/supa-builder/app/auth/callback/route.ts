/**
 * Auth Callback Route
 *
 * Handles the OAuth callback after successful authentication.
 * Exchanges the code for a session and redirects to the projects page.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      // Redirect to login with error
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/projects`)
}
