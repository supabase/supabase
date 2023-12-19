import { gotrueClient } from 'common'
import { LOCAL_STORAGE_KEYS, remove } from './storage'
import { useEffect } from 'react'

export const auth = gotrueClient

auth.onAuthStateChange((event) => {
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

  const {
    data: { session },
    error,
  } = await auth.getSession()
  if (error) {
    throw error
  }
  return session?.access_token
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
