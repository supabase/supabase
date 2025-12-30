import { createServerData$ } from 'solid-start/server'
import { useRouteData, createRouteAction } from 'solid-start'
import { Show, createSignal, onMount } from 'solid-js'
import { createBrowserClient } from '@supabase/ssr'

export const routeData = createServerData$(async (_, { request }) => {
  const { safeGetSession } = request.locals

  const { session, user } = await safeGetSession()

  return { session, user }
})

export default function Home() {
  const data = useRouteData<typeof routeData>()
  const [clientSession, setClientSession] = createSignal(null)

  const [loggingOut, { Form: LogoutForm }] = createRouteAction(async () => {
    const supabase = createBrowserClient(
      process.env.PUBLIC_SUPABASE_URL,
      process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY
    )

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      return
    }

    window.location.href = '/'
  })

  onMount(() => {
    const supabase = createBrowserClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY
    )

    supabase.auth.getSession().then(({ data: { session } }) => {
      setClientSession(session)
    })

    supabase.auth.onAuthStateChange((event, session) => {
      setClientSession(session)
    })
  })

  return (
    <div class="container">
      <h1>SolidStart + Supabase SSR Example</h1>

      <Show when={data()?.session} fallback={
        <div>
          <p>You are not authenticated on the server.</p>
          <a href="/login">Login</a>
        </div>
      }>
        <div>
          <h2>Server-side Authentication</h2>
          <p>Welcome, {data()?.user?.email}!</p>
          <p>Session expires: {new Date(data()?.session?.expires_at! * 1000).toLocaleString()}</p>

          <h2>Client-side Authentication</h2>
          <Show when={clientSession()} fallback={<p>No client session</p>}>
            <p>Client session: {clientSession()?.user?.email}</p>
          </Show>

          <LogoutForm>
            <button type="submit" disabled={loggingOut.pending}>
              {loggingOut.pending ? 'Logging out...' : 'Logout'}
            </button>
          </LogoutForm>
        </div>
      </Show>

      <div style={{ marginTop: '2rem' }}>
        <a href="/protected">Protected Route</a>
      </div>
    </div>
  )
}
