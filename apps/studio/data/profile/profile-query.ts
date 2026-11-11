import { useQuery } from '@tanstack/react-query'

import { profileKeys } from './keys'
import type { Profile } from './types'
import { parseResponseErrorBody } from '@/data/error-classification'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomQueryOptions } from '@/types'

/**
 * Profile responses the app handles as expected states, so they are not reported to Sentry:
 * 401 signs the user out, 403 is returned until MFA is completed, and 404 means the profile
 * doesn't exist yet and `ProfileProvider` creates it.
 */
const EXPECTED_PROFILE_ERROR_CODES = [401, 403, 404]

export async function getProfile(signal?: AbortSignal) {
  const { data, error } = await get('/platform/profile', {
    signal,
    headers: { Version: '2' },
  })

  if (error) {
    const code = parseResponseErrorBody(error)?.code
    const isExpected = code !== undefined && EXPECTED_PROFILE_ERROR_CODES.includes(code)
    handleError(error, { skipReport: isExpected })
  }

  if (!IS_PLATFORM) {
    return {
      ...data,
      disabled_features: process.env.NEXT_PUBLIC_DISABLED_FEATURES?.split(',') ?? [],
    } as Profile
  } else {
    return data as Profile
  }
}

export type ProfileData = Awaited<ReturnType<typeof getProfile>>
export type ProfileError = StudioError

export const useProfileQuery = <TData = ProfileData>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<ProfileData, ProfileError, TData> = {}) => {
  return useQuery<ProfileData, ProfileError, TData>({
    queryKey: profileKeys.profile(),
    queryFn: ({ signal }) => getProfile(signal),
    staleTime: 1000 * 60 * 30,
    ...options,
    enabled,
  })
}
