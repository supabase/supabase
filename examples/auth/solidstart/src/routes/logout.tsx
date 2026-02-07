import { action, redirect, useAction } from '@solidjs/router'
import { createClient } from '~/lib/supabase/server'

const logoutAction = action(async () => {
  'use server'
  const supabase = createClient()
  await supabase.auth.signOut()
  throw redirect('/')
})

export default function Logout() {
  const logout = useAction(logoutAction)

  return (
    <form action={logout} method="post">
      <button type="submit">Sign Out</button>
    </form>
  )
}
