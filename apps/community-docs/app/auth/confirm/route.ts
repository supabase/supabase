import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

import { isAllowedSupabaseEmail, normalizeEmail } from '@/lib/auth-email'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const nextParam = searchParams.get('next') ?? '/quality'
  const next = nextParam.startsWith('/') ? nextParam : '/quality'

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      redirect(
        `/login?next=${encodeURIComponent(next)}&message=${encodeURIComponent(error.message)}`
      )
    }
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (error) {
      redirect(
        `/login?next=${encodeURIComponent(next)}&message=${encodeURIComponent(error.message)}`
      )
    }
  } else {
    redirect(
      `/login?next=${encodeURIComponent(next)}&message=${encodeURIComponent('Invalid magic link.')}`
    )
  }

  const { data } = await supabase.auth.getClaims()
  const email = normalizeEmail(String(data?.claims?.email ?? ''))

  if (!isAllowedSupabaseEmail(email)) {
    await supabase.auth.signOut()
    redirect(
      `/login?next=${encodeURIComponent(next)}&message=${encodeURIComponent(
        'Only @supabase.com and @supabase.io emails can sign in.'
      )}`
    )
  }

  redirect(next)
}
