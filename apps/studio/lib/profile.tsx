import * as Sentry from '@sentry/react'
import { useQueryClient } from '@tanstack/react-query'
import { useIsLoggedIn, useUser } from 'common'
import { useRouter } from 'next/router'
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'

import { useSignOut } from './auth'
import { getGitHubProfileImgUrl } from './github'
import { CONFLICT_REFETCH_DELAYS_MS } from './profile.constants'
import { organizationKeys } from '@/data/organizations/keys'
import { permissionKeys } from '@/data/permissions/keys'
import { usePermissionsQuery } from '@/data/permissions/permissions-query'
import { usePermissionsQueryV2 } from '@/data/permissions/permissions-query-v2'
import { profileKeys } from '@/data/profile/keys'
import { useProfileCreateMutation } from '@/data/profile/profile-create-mutation'
import { useProfileIdentitiesQuery } from '@/data/profile/profile-identities-query'
import { useProfileQuery } from '@/data/profile/profile-query'
import type { Profile } from '@/data/profile/types'
import type { StudioError } from '@/lib/errors/studio-errors'
import { useTrack } from '@/lib/telemetry/track'

export type ProfileContextType = {
  profile: Profile | undefined
  error: StudioError | null
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

  // Set once profile creation returns a 409 for a user. Refetching the profile after a 409 puts
  // the query back in a pending state, which would otherwise trigger another create request every
  // time the refetch returns "not found". Only a 409 latches (not the request itself), so a lagging
  // read replica after a successful create can still recover through another create + 409 + refetch.
  const conflictUserIdRef = useRef<string | undefined>(undefined)
  // The API's message, set when the conflict can't be recovered from: the user is signed out and told why
  const [conflictSignOutMessage, setConflictSignOutMessage] = useState<string>()
  const isSigningOutForConflictRef = useRef(false)

  const refetchProfileAfterConflict = async (message: string) => {
    await queryClient.invalidateQueries({ queryKey: profileKeys.profile() })

    for (const delayMs of CONFLICT_REFETCH_DELAYS_MS) {
      if (queryClient.getQueryData(profileKeys.profile())) break
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      await queryClient.refetchQueries({ queryKey: profileKeys.profile(), exact: true })
    }

    if (queryClient.getQueryData(profileKeys.profile())) {
      conflictUserIdRef.current = undefined
      return
    }
    setConflictSignOutMessage(message)
  }

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
        if (user?.id) {
          conflictUserIdRef.current = user.id
          void refetchProfileAfterConflict(error.message)
        }
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

    // A 409 is being recovered from (see refetchProfileAfterConflict), so don't create again
    if (conflictUserIdRef.current === user.id) return

    createProfile()
  }, [isProfileNotFound, user?.id, createProfile])

  // Sign out before going to /sign-in, which would otherwise send a signed-in user back into the app
  useEffect(() => {
    if (conflictSignOutMessage === undefined || isSigningOutForConflictRef.current) return

    isSigningOutForConflictRef.current = true
    toast.error(conflictSignOutMessage, { id: 'profile-create-conflict', duration: Infinity })
    signOut()
      .then(() => router.push('/sign-in'))
      .finally(() => {
        // A fresh sign-in gets a fresh attempt, rather than reusing this conflict
        conflictUserIdRef.current = undefined
        isSigningOutForConflictRef.current = false
        setConflictSignOutMessage(undefined)
      })
  }, [conflictSignOutMessage, signOut, router])

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
  const { isInitialLoading: isLoadingPermissionsV2 } = usePermissionsQueryV2({
    enabled: isLoggedIn,
  })

  const value = useMemo(() => {
    const isLoading =
      isLoadingProfile || isCreatingProfile || isLoadingPermissions || isLoadingPermissionsV2

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
    isLoadingPermissionsV2,
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
