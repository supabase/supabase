import { Session } from '@supabase/supabase-js'
import { gotrueClient } from 'common'
import { LOCAL_STORAGE_KEYS, remove } from './storage'
import { useEffect } from 'react'

export const auth = gotrueClient

let currentSession: Session | null

auth.onAuthStateChange((event, session) => {
  currentSession = session

  if (event === 'SIGNED_OUT') {
    Object.keys(LOCAL_STORAGE_KEYS).forEach((key) => {
      remove('local', LOCAL_STORAGE_KEYS[key])
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
  useEffect(() => {
    const {
      data: {
        subscription: { unsubscribe },
      },
    } = auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        callback()
      }
    })

    return unsubscribe
  }, [callback])
}
