import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'
import { profileKeys } from './keys'
import type { Profile } from './types'

export type ProfileResponse = Profile

export async function getProfile(signal?: AbortSignal) {
  const response = await get(`${API_URL}/profile`, {
    signal,
    headers: { Version: '2' },
  })
  if (response.error) throw response.error

  if (!IS_PLATFORM) {
    response.disabled_features = process.env.NEXT_PUBLIC_DISABLED_FEATURES?.split(',') ?? []
  }

  return response as ProfileResponse
}

export type ProfileData = Awaited<ReturnType<typeof getProfile>>
export type ProfileError = ResponseError

export const useProfileQuery = <TData = ProfileData>({
  enabled = true,
  ...options
}: UseQueryOptions<ProfileData, ProfileError, TData> = {}) => {
  return useQuery<ProfileData, ProfileError, TData>(
    profileKeys.profile(),
    ({ signal }) => getProfile(signal),
    {
      staleTime: 1000 * 60 * 30, // default good for 30 mins
      ...options,
      enabled,
    }
  )
}
