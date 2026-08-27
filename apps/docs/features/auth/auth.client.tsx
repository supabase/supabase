'use client'

import { useQueryClient } from '@tanstack/react-query'
import { AuthProvider, clearLocalStorage } from 'common'
import { type PropsWithChildren, useCallback } from 'react'
import { useOnLogout } from '~/lib/userAuth'

/**
 *
 * !!! IMPORTANT !!!
 * Ensure data is cleared on sign out.
 *
 */
const SignOutHandler = ({ children }: PropsWithChildren) => {
  const queryClient = useQueryClient()

  const cleanUp = useCallback(() => {
    queryClient.cancelQueries()
    queryClient.clear()

    clearLocalStorage()
  }, [queryClient])

  useOnLogout(cleanUp)

  return <>{children}</>
}

const AuthContainer = ({ children }: PropsWithChildren) => (
  <AuthProvider>
    <SignOutHandler>{children}</SignOutHandler>
  </AuthProvider>
)

export { AuthContainer }
