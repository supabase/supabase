import { useQueryClient } from '@tanstack/react-query'
import { PropsWithChildren, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

import {
  AuthProvider as AuthProviderInternal,
  clearLocalStorage,
  gotrueClient,
  posthogClient,
  useAuthError,
} from 'common'
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

/**
 * Clears the React Query cache when a different user signs in.
 *
 * Query keys don't include user identifiers, so if a new session is established
 * (e.g. clicking an email verification link while still logged in as another account)
 * without going through the explicit sign-out flow, stale data from the previous
 * user would persist and cause permission errors.
 */
const AuthCacheSync = ({ children }: PropsWithChildren) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    let prevUserId: string | undefined

    const {
      data: { subscription },
    } = gotrueClient.onAuthStateChange((event, session) => {
      const currentUserId = session?.user?.id

      if (event === 'SIGNED_IN' && prevUserId !== undefined && currentUserId !== prevUserId) {
        queryClient.clear()
      }

      prevUserId = currentUserId
    })

    return subscription.unsubscribe
  }, [queryClient])

  return <>{children}</>
}

export const AuthProvider = ({ children }: PropsWithChildren) => {
  return (
    <AuthProviderInternal alwaysLoggedIn={!IS_PLATFORM}>
      <AuthCacheSync>
        <AuthErrorToaster>{children}</AuthErrorToaster>
      </AuthCacheSync>
    </AuthProviderInternal>
  )
}

export function useSignOut() {
  const queryClient = useQueryClient()
  const { clearStorage: clearAssistantStorage } = useAiAssistantStateSnapshot()

  return useCallback(async () => {
    const result = await gotrueClient.signOut()
    posthogClient.reset()
    clearLocalStorage()
    // Clear Assistant IndexedDB
    await clearAssistantStorage()
    queryClient.clear()

    return result
  }, [queryClient, clearAssistantStorage])
}
