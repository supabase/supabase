import { Session } from '@supabase/supabase-js'
import { gotrueClient as auth } from 'common'

let currentSession: Session | null = null

export async function getAccessToken() {
  // ignore if server-side
  if (typeof window === 'undefined') {
    return
  }

  if (!currentSession) {
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
