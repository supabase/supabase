import { action, redirect } from '@solidjs/router'
import { getSupabaseServerClient } from '~/lib/supabase/server'

export const POST = action(async () => {
  'use server'
  const supabase = getSupabaseServerClient()

  try {
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Error signing out:', error)
    // Still redirect even if sign out fails
  }

  throw redirect('/')
})

export default function Logout() {
  return null
}
