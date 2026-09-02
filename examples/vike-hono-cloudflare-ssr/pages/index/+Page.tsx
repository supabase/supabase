// Example page component
import { createSupabaseBrowserClient } from '../utils/supabase-browser'

export function Page({ user }: { user: any }) {
  const supabase = createSupabaseBrowserClient()

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.reload()
  }

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github', // or your preferred provider
      options: {
        redirectTo: window.location.origin
      }
    })
  }

  return (
    <div>
      <h1>Vike + Hono + Supabase SSR Demo</h1>
      
      {user ? (
        <div>
          <p>Welcome, {user.email}!</p>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <div>
          <p>You are not logged in.</p>
          <button onClick={handleSignIn}>Sign In with GitHub</button>
        </div>
      )}
    </div>
  )
}
