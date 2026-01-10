import { A } from '@solidjs/router'
import { createAsync, query, redirect } from '@solidjs/router'
import { getSupabaseServerClient } from '~/lib/supabase/server'

const getUser = query(async () => {
  'use server'
  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw redirect('/login')
  }

  return user
}, 'protected-user')

export const route = {
  load: () => getUser()
}

export default function Protected() {
  const user = createAsync(() => getUser(), { deferStream: true })

  return (
    <main>
      <h1>Protected Page</h1>
      <p>This page is only accessible to authenticated users.</p>
      <p>Your email: {user()?.email}</p>
      <p>User ID: {user()?.id}</p>

      <br />
      <A href="/">
        <button>Back to Home</button>
      </A>
    </main>
  )
}
