import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/protected'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // Redirect user to specified redirect URL or default to protected page
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Redirect the user to an error page with some instructions
  return NextResponse.redirect(new URL('/auth/error', request.url))
}
