import * as Sentry from '@sentry/nextjs'
import { gotrueClient, setCaptureException } from 'common'
import { useEffect } from 'react'

setCaptureException((e: any) => {
  Sentry.captureException(e)
})

export const auth = gotrueClient

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
