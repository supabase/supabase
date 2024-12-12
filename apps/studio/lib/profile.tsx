import { useIsLoggedIn } from 'common'
import { PropsWithChildren, createContext, useContext, useMemo } from 'react'
import { toast } from 'sonner'

import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useProfileCreateMutation } from 'data/profile/profile-create-mutation'
import { useProfileQuery } from 'data/profile/profile-query'
import type { Profile } from 'data/profile/types'
import { useSendIdentifyMutation } from 'data/telemetry/send-identify-mutation'
import type { ResponseError } from 'types'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { TelemetryActions } from './constants/telemetry'

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

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: sendIdentify } = useSendIdentifyMutation()
  const { mutate: createProfile, isLoading: isCreatingProfile } = useProfileCreateMutation({
    onSuccess: () => {
      sendEvent({ action: TelemetryActions.SIGN_UP, properties: { category: 'conversion' } })
    },
    onError: () => toast.error('Failed to create your profile. Please refresh to try again.'),
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
    onSuccess(profile) {
      sendIdentify({ user: profile })
    },
    onError(err) {
      // if the user does not yet exist, create a profile for them
      if (typeof err === 'object' && err !== null && err.message === "User's profile not found") {
        createProfile()
      }
    },
  })

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
