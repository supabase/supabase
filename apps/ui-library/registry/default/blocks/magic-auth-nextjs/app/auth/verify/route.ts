import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/example/magic-auth/protected'

  if (code) {
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      redirect(next)
    } else {
      redirect(`/auth/error?error=${error?.message}`)
    }
  }

  redirect('/auth/error?error=No verification code found')
}
