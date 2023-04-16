import {
  AuthContext as AuthContextInternal,
  AuthProvider as AuthProviderInternal,
  AuthProviderProps,
  gotrueClient,
} from 'common'
import { useProfileQuery } from 'data/profile/profile-query'
import { useStore } from 'hooks'
import { PropsWithChildren, useEffect } from 'react'
import { GOTRUE_ERRORS, IS_PLATFORM } from './constants'

export const AuthContext = AuthContextInternal

export const AuthProvider = ({ children }: PropsWithChildren<{}>) => {
  const { ui, app } = useStore()

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

  // Track telemetry for the current user
  useProfileQuery({
    onSuccess(profile) {
      ui.setProfile(profile)

      // [Joshen] Temp fix: For new users, the GET profile call also creates a default org
      // But because the dashboard's logged in state is using gotrue as the source of truth
      // the home page loads before the GET profile call completes (and consequently before the
      // creation of the default org). Hence why calling org load here
      app.organizations.load()
    },
    // Never rerun the query
    staleTime: Infinity,
    cacheTime: Infinity,
  })

  return <AuthProviderInternal alwaysLoggedIn={!IS_PLATFORM}>{children}</AuthProviderInternal>
}

export { useAuth, useIsLoggedIn, useSession, useUser } from 'common'
