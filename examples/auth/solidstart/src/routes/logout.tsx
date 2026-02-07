import { action, redirect } from '@solidjs/router'
import { createClient } from '~/lib/supabase/server'

export const POST = action(async () => {
  'use server'
  const supabase = createClient()
  await supabase.auth.signOut()
  throw redirect('/')
})

export default function Logout() {
  return null
}
