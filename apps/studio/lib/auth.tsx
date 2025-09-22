import { useQueryClient } from '@tanstack/react-query'
import {
  AuthProvider as AuthProviderInternal,
  clearLocalStorage,
  gotrueClient,
  useAuthError,
} from 'common'
import { PropsWithChildren, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { GOTRUE_ERRORS, IS_PLATFORM } from './constants'

const AuthErrorToaster = ({ children }: PropsWithChildren) => {
  const error = useAuthError()

  useEffect(() => {
    if (error !== null) {
      // Check for unverified GitHub users after a GitHub sign in
      if (error.message === GOTRUE_ERRORS.UNVERIFIED_GITHUB_USER) {
        toast.error(
          'Please verify your email on GitHub first, then reach out to us at support@supabase.io to log into the dashboard'
        )
        return
      }

      toast.error(error.message)
    }
  }, [error])

  return children
}

export const AuthProvider = ({ children }: PropsWithChildren) => {
  return (
    <AuthProviderInternal alwaysLoggedIn={!IS_PLATFORM}>
      <AuthErrorToaster>{children}</AuthErrorToaster>
    </AuthProviderInternal>
  )
}

export { useAuth, useIsLoggedIn, useSession, useUser } from 'common'

export function useSignOut() {
  const queryClient = useQueryClient()
  const { clearStorage: clearAssistantStorage } = useAiAssistantStateSnapshot()

  return useCallback(async () => {
    const result = await gotrueClient.signOut()
    clearLocalStorage()
    // Clear Assistant IndexedDB
    await clearAssistantStorage()
    await queryClient.clear()

    return result
  }, [queryClient, clearAssistantStorage])
}
