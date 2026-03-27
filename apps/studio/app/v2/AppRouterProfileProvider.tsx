'use client'

import { type PropsWithChildren, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useIsLoggedIn } from 'common'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useProfileCreateMutation } from 'data/profile/profile-create-mutation'
import { useProfileQuery } from 'data/profile/profile-query'
import { ProfileContext } from 'lib/profile'
import { useSignOut } from 'lib/auth'

/**
 * App-router-compatible drop-in for ProfileProvider from lib/profile.
 * The only difference is using next/navigation's useRouter instead of next/router.
 */
export function AppRouterProfileProvider({ children }: PropsWithChildren) {
  const router = useRouter()
  const isLoggedIn = useIsLoggedIn()
  const signOut = useSignOut()

  const { mutate: createProfile, isPending: isCreatingProfile } = useProfileCreateMutation({
    onError: (error) => {
      if (error.code === 409) return // profile already exists — ignore
    },
  })

  const {
    error,
    data: profile,
    isPending: isLoadingProfile,
    isError,
    isSuccess,
  } = useProfileQuery({ enabled: isLoggedIn })

  useEffect(() => {
    if (!isError) return
    if (error?.message === "User's profile not found") {
      createProfile()
    }
    if (error?.code === 401) {
      signOut().then(() => router.push('/sign-in'))
    }
  }, [error, signOut, router, createProfile, isError])

  const { isInitialLoading: isLoadingPermissions } = usePermissionsQuery({ enabled: isLoggedIn })

  const value = useMemo(
    () => ({
      error,
      profile,
      isLoading: isLoadingProfile || isCreatingProfile || isLoadingPermissions,
      isError,
      isSuccess,
    }),
    [isLoadingProfile, isCreatingProfile, isLoadingPermissions, profile, error, isError, isSuccess]
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
