import { A } from '@solidjs/router'
import { createAsync } from '@solidjs/router'
import { cache } from '@solidjs/router'
import { Show } from 'solid-js'
import { getSupabaseServerClient } from '~/lib/supabase/server'

const getUser = cache(async () => {
  'use server'
  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}, 'user')

export const route = {
  load: () => getUser()
}

export default function Home() {
  const user = createAsync(() => getUser())

  return (
    <main>
      <h1>SolidStart + Supabase Auth</h1>

      <Show
        when={user()}
        fallback={
          <div>
            <p>You are not logged in.</p>
            <A href="/login">
              <button>Sign In</button>
            </A>
          </div>
        }
      >
        <p>Welcome, {user()?.email}!</p>
        <A href="/protected">
          <button>Visit Protected Page</button>
        </A>
        <br /><br />
        <A href="/logout">
          <button>Sign Out</button>
        </A>
      </Show>
    </main>
  )
}
