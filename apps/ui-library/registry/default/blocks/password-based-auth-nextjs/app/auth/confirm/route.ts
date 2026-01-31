import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const _next = searchParams.get('next')
  const next = _next?.startsWith('/') ? _next : '/'

  if (token_hash && type) {
    const supabase = await createClient()
    
    try{
      const { data, error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })
      if (!error && data?.session) {
        redirect(next)
      } else {
        redirect(`/auth/error?error=${encodeURIComponent(error?.message || 'Failed to verify token')}`)
      }
    } catch (err) {
      redirect(`/auth/error?error=${encodeURIComponent('Unexpected error during verification')}`)
    }
  }
  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=No token hash or type`)
}
