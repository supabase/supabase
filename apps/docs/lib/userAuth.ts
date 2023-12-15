import { Session } from '@supabase/supabase-js'
import { LOCAL_STORAGE_KEYS, gotrueClient, useIsLoggedIn, useIsUserLoading } from 'common'
import { remove } from './storage'
import { useRef } from 'react'

export const auth = gotrueClient

let currentSession: Session | null

auth.onAuthStateChange((event, session) => {
  currentSession = session

  if (event === 'SIGNED_OUT') {
    Object.keys(LOCAL_STORAGE_KEYS).forEach((key) => {
      remove('local', key)
    })
  }
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

export function useOnLogout(callback: () => void) {
  const isLoggedIn = useIsLoggedIn()
  const isPreviousLoggedIn = useRef(isLoggedIn)

  if (!isLoggedIn && isPreviousLoggedIn.current) {
    // Just logged out
    callback()
  }

  isPreviousLoggedIn.current = isLoggedIn
}
