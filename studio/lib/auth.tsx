import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { PropsWithChildren, useCallback, useEffect } from 'react'

import {
  AuthContext as AuthContextInternal,
  AuthProvider as AuthProviderInternal,
  gotrueClient,
  useTelemetryProps,
} from 'common'
import { useStore } from 'hooks'
import Telemetry from 'lib/telemetry'
import { GOTRUE_ERRORS, IS_PLATFORM } from './constants'
import { clearLocalStorage, resetSignInClicks } from './local-storage'

export const AuthContext = AuthContextInternal

export const AuthProvider = ({ children }: PropsWithChildren<{}>) => {
  const { ui } = useStore()
  const router = useRouter()
  const telemetryProps = useTelemetryProps()

  // Check for unverified GitHub users after a GitHub sign in
  useEffect(() => {
    async function handleEmailVerificationError() {
      const { error } = await gotrueClient.initialize()

      if (error?.message === GOTRUE_ERRORS.UNVERIFIED_GITHUB_USER) {
        ui.setNotification({
          category: 'error',
          message:
            'Please verify your email on GitHub first, then reach out to us at support@supabase.io to log into the dashboard',
        })
      }
    }

    handleEmailVerificationError()
  }, [])

  useEffect(() => {
    const {
      data: { subscription },
    } = gotrueClient.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        Telemetry.sendEvent(
          { category: 'account', action: 'sign_in', label: '' },
          telemetryProps,
          router
        )
      }
    })

    return subscription.unsubscribe
  }, [])

  return <AuthProviderInternal alwaysLoggedIn={!IS_PLATFORM}>{children}</AuthProviderInternal>
}

export { useAuth, useIsLoggedIn, useSession, useUser } from 'common'

export function useSignOut() {
  const queryClient = useQueryClient()

  return useCallback(async () => {
    resetSignInClicks()

    const result = await gotrueClient.signOut()
    clearLocalStorage()
    await queryClient.clear()

    return result
  }, [queryClient])
}
