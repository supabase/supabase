'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { isAllowedSupabaseEmail, normalizeEmail } from '@/lib/auth-email'
import { createClient } from '@/lib/supabase/server'

function getBasePath() {
  return process.env.NEXT_PUBLIC_BASE_PATH || '/community-docs'
}

export async function requestMagicLink(formData: FormData) {
  const email = normalizeEmail(String(formData.get('email') ?? ''))
  const next = String(formData.get('next') ?? '/quality')
  const safeNext = next.startsWith('/') ? next : '/quality'

  if (!email) {
    redirect(
      `/login?next=${encodeURIComponent(safeNext)}&message=${encodeURIComponent('Enter your email.')}`
    )
  }

  if (!isAllowedSupabaseEmail(email)) {
    redirect(
      `/login?next=${encodeURIComponent(safeNext)}&message=${encodeURIComponent(
        'Only @supabase.com and @supabase.io emails can sign in.'
      )}`
    )
  }

  const headerStore = await headers()
  // Prefer forwarded host on Vercel previews; fall back to Origin, then local dev.
  const forwardedHost = headerStore.get('x-forwarded-host')
  const forwardedProto = headerStore.get('x-forwarded-proto') ?? 'https'
  const origin =
    headerStore.get('origin') ??
    (forwardedHost ? `${forwardedProto}://${forwardedHost}` : 'http://localhost:3002')
  const basePath = getBasePath()
  const emailRedirectTo = `${origin}${basePath}/auth/confirm?next=${encodeURIComponent(safeNext)}`

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo,
      shouldCreateUser: true,
    },
  })

  if (error) {
    redirect(
      `/login?next=${encodeURIComponent(safeNext)}&message=${encodeURIComponent(error.message)}`
    )
  }

  redirect(
    `/login?next=${encodeURIComponent(safeNext)}&message=${encodeURIComponent(
      'Check your email for a magic link.'
    )}`
  )
}
