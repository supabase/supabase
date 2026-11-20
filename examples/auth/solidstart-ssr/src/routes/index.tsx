import { createSignal, onMount } from 'solid-js'
import { createSupabaseBrowserClient } from '../lib/supabase'

/**
 * Home page — shows session state and a login/logout button.
 *
 * The initial session comes from the server-side layout loader
 * (src/routes/layout.ts), which validates the auth cookie and returns
 * serialized user data. On mount, the component hydrates the browser
 * client so it can perform client-side auth flows (signOut, etc).
 */
export default function Page() {
  const [user, setUser] = createSignal<any>(null)

  onMount(async () => {
    const supabase = createSupabaseBrowserClient()
    const {
      data: { user: browserUser },
    } = await supabase.auth.getUser()
    setUser(browserUser)
  })

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    setUser(null)
    // Reload to clear server-side session state
    window.location.reload()
  }

  return (
    <main style={{ padding: '2rem', 'max-width': '600px', margin: '0 auto' }}>
      <h1>SolidStart + Supabase SSR Example</h1>

      <div style={{ marginTop: '1.5rem', padding: '1rem', 'background': '#f4f4f5', 'border-radius': '8px' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', 'font-size': '1rem' }}>Session</h2>
        {user() ? (
          <div>
            <p style={{ margin: '0.25rem 0' }}>
              <strong>{user().email}</strong>
            </p>
            <p style={{ margin: '0.25rem 0', 'color': '#666', 'font-size': '0.875rem' }}>
              ID: {user().id}
            </p>
            <button
              onClick={handleSignOut}
              style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <p style={{ margin: '0', color: '#888' }}>
            Not signed in. Configure Supabase Auth (e.g. email magic link) to see the flow.
          </p>
        )}
      </div>

      <h2 style={{ marginTop: '2rem', 'font-size': '1.1rem' }}>Key files</h2>
      <ul style={{ paddingLeft: '1.25rem' }}>
        <li>
          <code>src/lib/supabase.ts</code> — Server and browser client factories
        </li>
        <li>
          <code>src/lib/session.ts</code> — Server$ function for protected data loading
        </li>
        <li>
          <code>src/routes/layout.ts</code> — Layout-level session check (runs server-side)
        </li>
        <li>
          <code>src/routes/index.tsx</code> — UI component, hydrates browser client on mount
        </li>
      </ul>

      <h2 style={{ marginTop: '1.5rem', 'font-size': '1.1rem' }}>Why this pattern?</h2>
      <ol style={{ paddingLeft: '1.25rem', 'line-height': '1.6' }}>
        <li>
          <strong>No middleware-only auth client leakage.</strong> Unlike Next.js's{' '}
          <code>NextRequest</code> / <code>NextResponse</code>, SolidStart does not pass a response
          object through middleware by default. Creating the server client inside{' '}
          <code>server$</code> functions keeps all server-only code tree-shakable.
        </li>
        <li>
          <strong>Separation of concerns.</strong> The <code>server$</code> loader reads cookies
          and validates the session; the component only hydrates a browser client for{' '}
          client-side flows.
        </li>
        <li>
          <strong>Avoids <code>"use server"</code> misuse.</strong> SolidStart does not have an
          equivalent of Next.js's <code>"use server"</code> pragma. Server functions are
          explicitly marked with <code>createServerFn</code>, which prevents accidental server
          code in client bundles.
        </li>
      </ol>
    </main>
  )
}
