import { action, redirect } from '@solidjs/router'
import { getSupabaseServerClient } from '~/lib/supabase/server'

export const GET = action(async () => {
  'use server'
  const supabase = getSupabaseServerClient()
  await supabase.auth.signOut()
  throw redirect('/')
})

export default function Logout() {
  return null
}
