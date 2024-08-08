import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Redirect to supabase.com until this site is live
// when ready, remove the VERCEL env var at
// https://vercel.com/supabase/database-new/settings/environment-variables
export function middleware(request: NextRequest) {
  if (process.env.VERCEL === '1') {
    return NextResponse.redirect(new URL('https://supabase.com', request.url))
  }
}
