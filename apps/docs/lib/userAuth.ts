import { Session } from '@supabase/supabase-js'
import { gotrueClient as auth } from 'common'

let currentSession: Session | null

auth.onAuthStateChange((_, session) => {
  currentSession = session
})

export async function getAccessToken() {
  // ignore if server-side
  if (typeof window === 'undefined') {
    return
  }

  const aboutToExpire = currentSession?.expires_at
    ? currentSession.expires_at - Math.ceil(Date.now() / 1000) < 30
    : false

  if (!currentSession || aboutToExpire) {
    const {
      data: { session },
      error,
    } = await auth.getSession()
    if (error) {
      throw error
    }
    return session?.access_token
  }

  return currentSession.access_token
}
