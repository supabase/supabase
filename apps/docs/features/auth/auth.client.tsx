'use client'

import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { createClient } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { AuthProvider, useConstant } from 'common'
import { type PropsWithChildren, useCallback } from 'react'
import { IS_PLATFORM } from '~/lib/constants'
import { LOCAL_STORAGE_KEYS, remove } from '~/lib/storage'
import { useOnLogout } from '~/lib/userAuth'

const AuthContainerInternal = ({ children }: PropsWithChildren) => {
  const supabase = useConstant(() =>
    IS_PLATFORM
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
      : undefined
  )

  return IS_PLATFORM ? (
    <SessionContextProvider supabaseClient={supabase!}>
      <AuthProvider>{children}</AuthProvider>
    </SessionContextProvider>
  ) : (
    <AuthProvider>{children}</AuthProvider>
  )
}

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
  <AuthContainerInternal>
    <SignOutHandler>{children}</SignOutHandler>
  </AuthContainerInternal>
)

export { AuthContainer }
