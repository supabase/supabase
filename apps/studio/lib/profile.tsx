import * as Sentry from '@sentry/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { useIsLoggedIn, useUser } from 'common'
import { useRouter } from 'next/router'
import { createContext, PropsWithChildren, useContext, useEffect, useMemo } from 'react'
import { toast } from 'sonner'

import { useSignOut } from './auth'
import { getGitHubProfileImgUrl } from './github'
import { organizationKeys } from '@/data/organizations/keys'
import { permissionKeys } from '@/data/permissions/keys'
import { usePermissionsQuery } from '@/data/permissions/permissions-query'
import { profileKeys } from '@/data/profile/keys'
import { useProfileCreateMutation } from '@/data/profile/profile-create-mutation'
import { useProfileIdentitiesQuery } from '@/data/profile/profile-identities-query'
import { useProfileQuery } from '@/data/profile/profile-query'
import type { Profile } from '@/data/profile/types'
import { useTrack } from '@/lib/telemetry/track'
import type { ResponseError } from '@/types'

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
  const user = useUser()
  const queryClient = useQueryClient()
  const isLoggedIn = useIsLoggedIn()
  const router = useRouter()
  const signOut = useSignOut()

  const track = useTrack()
  const { mutate: createProfile, isPending: isCreatingProfile } = useProfileCreateMutation({
    onSuccess: () => {
      track('sign_up', { category: 'conversion' })

      if (user) {
        // Send an event to GTM, will do nothing if GTM is not enabled
        const thisWindow = window as any
        thisWindow.dataLayer = thisWindow.dataLayer || []
        thisWindow.dataLayer.push({
          event: 'sign_up',
          email: user.email,
        })
      }
    },
    onError: (error) => {
      if (error.code === 409) {
        // The profile already exists (e.g. GET hit a lagging replica, or it was created
        // elsewhere), so the earlier "not found" is stale. Refetch rather than leaving the
        // user stuck on the cached error. Sentry capture is kept to monitor how often this occurs.
        Sentry.captureMessage('Profile already exists: ' + error.message)
        queryClient.invalidateQueries({ queryKey: profileKeys.profile() })
        queryClient.invalidateQueries({ queryKey: organizationKeys.list() })
        queryClient.invalidateQueries({ queryKey: permissionKeys.list() })
      } else {
        Sentry.captureMessage('Failed to create users profile: ' + error.message)
        toast.error('Failed to create your profile. Please refresh to try again.')
      }
    },
  })

  // Track telemetry for the current user
  const {
    error,
    data: profile,
    isPending: isLoadingProfile,
    isError,
    isSuccess,
  } = useProfileQuery({
    enabled: isLoggedIn,
  })

  const isProfileNotFound = isError && error?.message === "User's profile not found"
  useEffect(() => {
    if (!isProfileNotFound || !user?.id) return
    createProfile()
  }, [isProfileNotFound, user?.id, createProfile])

  // [Alaister] If the user has a bad auth token, auth-js won't know about it
  // and will think the user is authenticated. Since fetching the profile happens
  // on every page load, we can check for a 401 here and sign the user out if
  // they have a bad token.
  const isUnauthorized = isError && error?.code === 401
  useEffect(() => {
    if (!isUnauthorized) return
    signOut().then(() => router.push('/sign-in'))
  }, [isUnauthorized, signOut, router])

  const { isInitialLoading: isLoadingPermissions } = usePermissionsQuery({ enabled: isLoggedIn })

  const value = useMemo(() => {
    const isLoading = isLoadingProfile || isCreatingProfile || isLoadingPermissions

    return {
      error,
      profile,
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

export function useProfileNameAndPicture(): {
  username?: string
  primaryEmail?: string
  avatarUrl?: string
  isLoading: boolean
} {
  const { profile, isLoading: isLoadingProfile } = useProfile()
  const { data: identitiesData, isPending: isLoadingIdentities } = useProfileIdentitiesQuery()

  const isGitHubProfile = profile?.auth0_id?.startsWith('github')

  const gitHubUsername = isGitHubProfile
    ? identitiesData?.identities.find((x) => x.provider === 'github')?.identity_data?.user_name
    : undefined
  const avatarUrl = isGitHubProfile ? getGitHubProfileImgUrl(gitHubUsername) : undefined

  return {
    username: profile?.username,
    primaryEmail: profile?.primary_email,
    avatarUrl,
    isLoading: isLoadingProfile || isLoadingIdentities,
  }
}
