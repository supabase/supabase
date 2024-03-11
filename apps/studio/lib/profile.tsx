import { useIsLoggedIn, useTelemetryProps } from 'common'
import { useRouter } from 'next/router'
import { PropsWithChildren, createContext, useContext, useMemo } from 'react'
import toast from 'react-hot-toast'

import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useProfileCreateMutation } from 'data/profile/profile-create-mutation'
import { useProfileQuery } from 'data/profile/profile-query'
import type { Profile } from 'data/profile/types'
import Telemetry from 'lib/telemetry'
import type { ResponseError } from 'types'

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
  const router = useRouter()
  const telemetryProps = useTelemetryProps()

  const isLoggedIn = useIsLoggedIn()

  const { mutate: createProfile, isLoading: isCreatingProfile } = useProfileCreateMutation({
    async onSuccess() {
      Telemetry.sendEvent(
        { category: 'conversion', action: 'sign_up', label: '' },
        telemetryProps,
        router
      )
    },
    onError() {
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
    onSuccess(profile) {
      Telemetry.sendIdentify(profile, telemetryProps)
    },
    onError(err) {
      // if the user does not yet exist, create a profile for them
      if (typeof err === 'object' && err !== null && 'code' in err && (err as any).code === 404) {
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
