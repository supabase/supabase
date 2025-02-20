import * as Sentry from '@sentry/nextjs'
import { useIsLoggedIn } from 'common'
import { useRouter } from 'next/router'
import { PropsWithChildren, createContext, useContext, useMemo } from 'react'
import { toast } from 'sonner'

import { TelemetryActions } from 'common/telemetry-constants'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useProfileCreateMutation } from 'data/profile/profile-create-mutation'
import { useProfileQuery } from 'data/profile/profile-query'
import type { Profile } from 'data/profile/types'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import type { ResponseError } from 'types'
import { useSignOut } from './auth'
import { getGitHubProfileImgUrl } from './github'

export type ProfileContextType = {
  profile: Profile | undefined
  error: ResponseError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
}

export const ProfileContext = createContext<ProfileContextType>({
  profile: undefined,
  error: null,
  isLoading: true,
  isError: false,
  isSuccess: false,
})

export const ProfileProvider = ({ children }: PropsWithChildren<{}>) => {
  const isLoggedIn = useIsLoggedIn()
  const router = useRouter()
  const signOut = useSignOut()

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: createProfile, isLoading: isCreatingProfile } = useProfileCreateMutation({
    onSuccess: () => {
      sendEvent({ action: TelemetryActions.SIGN_UP, properties: { category: 'conversion' } })
    },
    onError: (error) => {
      Sentry.captureMessage('Failed to create users profile: ' + error.message)
      toast.error('Failed to create your profile. Please refresh to try again.')
    },
  })

  // Track telemetry for the current user
  const {
    error,
    data: profile,
    isLoading: isLoadingProfile,
    isError,
    isSuccess,
  } = useProfileQuery({
    enabled: isLoggedIn,
    onError(err) {
      // if the user does not yet exist, create a profile for them
      if (err.message === "User's profile not found") {
        createProfile()
      }

      // [Alaister] If the user has a bad auth token, auth-js won't know about it
      // and will think the user is authenticated. Since fetching the profile happens
      // on every page load, we can check for a 401 here and sign the user out if
      // they have a bad token.
      if (err.code === 401) {
        signOut().then(() => router.push('/sign-in'))
      }
    },
  })

  const { isInitialLoading: isLoadingPermissions } = usePermissionsQuery({ enabled: isLoggedIn })

  const value = useMemo(() => {
    const isLoading = isLoadingProfile || isCreatingProfile || isLoadingPermissions
    const isGHUser = !!profile && 'auth0_id' in profile && profile?.auth0_id.startsWith('github')
    const profileImageUrl = isGHUser ? getGitHubProfileImgUrl(profile.username) : undefined

    return {
      error,
      profile: !!profile ? { ...profile, profileImageUrl } : undefined,
      isLoading,
      isError,
      isSuccess,
    }
  }, [
    isLoadingProfile,
    isCreatingProfile,
    isLoadingPermissions,
    profile,
    error,
    isError,
    isSuccess,
  ])

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export const useProfile = () => useContext(ProfileContext)
