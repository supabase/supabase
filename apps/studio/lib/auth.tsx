import { useQueryClient } from '@tanstack/react-query'
import { AuthProvider as AuthProviderInternal, gotrueClient } from 'common'
import { PropsWithChildren, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

import { GOTRUE_ERRORS, IS_PLATFORM } from './constants'
import { clearLocalStorage } from './local-storage'

export const AuthProvider = ({ children }: PropsWithChildren<{}>) => {
  // Check for unverified GitHub users after a GitHub sign in
  useEffect(() => {
    async function handleEmailVerificationError() {
      const { error } = await gotrueClient.initialize()

      if (error?.message === GOTRUE_ERRORS.UNVERIFIED_GITHUB_USER) {
        toast.error(
          'Please verify your email on GitHub first, then reach out to us at support@supabase.io to log into the dashboard'
        )
      }
    }

    handleEmailVerificationError()
  }, [])

  return <AuthProviderInternal alwaysLoggedIn={!IS_PLATFORM}>{children}</AuthProviderInternal>
}

export { useAuth, useIsLoggedIn, useSession, useUser } from 'common'

export function useSignOut() {
  const queryClient = useQueryClient()

  return useCallback(async () => {
    const result = await gotrueClient.signOut()
    clearLocalStorage()
    await queryClient.clear()

    return result
  }, [queryClient])
}
