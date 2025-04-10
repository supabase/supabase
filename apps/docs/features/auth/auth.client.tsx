'use client'

import { useQueryClient } from '@tanstack/react-query'
import { AuthProvider } from 'common'
import { type PropsWithChildren, useCallback } from 'react'
import { LOCAL_STORAGE_KEYS, remove } from '~/lib/storage'
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

    Object.keys(LOCAL_STORAGE_KEYS).forEach((key) => {
      remove('local', LOCAL_STORAGE_KEYS[key])
    })
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
