'use server'

import { headers } from 'next/headers'

import { createClient } from '@/lib/supabase/server'

export type LoginState = { error?: string; sent?: boolean }

export async function sendMagicLink(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()

  if (!email) {
    return { error: 'Enter your email address.' }
  }

  const supabase = await createClient()
  const originHeader = (await headers()).get('origin')

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${originHeader}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { sent: true }
}
