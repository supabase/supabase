'use server'

import { headers } from 'next/headers'

import { createClient } from '@/lib/supabase/server'

export async function sendMagicLink(
  _prevState: { error?: string; sent?: boolean },
  formData: FormData
) {
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
