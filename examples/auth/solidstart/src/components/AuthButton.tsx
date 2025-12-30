import { createClient } from '~/lib/supabase'
import { createSignal } from 'solid-js'

export default function AuthButton() {
  const [session, setSession] = createSignal(null)
  const supabase = createClient()

  // Handle auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    setSession(session)
  })

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div>
      {session() ? (
        <button onClick={signOut}>Sign Out</button>
      ) : (
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}>
          Sign In with Google
        </button>
      )}
    </div>
  )
}
