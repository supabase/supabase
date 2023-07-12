import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { profileKeys } from './keys'
import { Profile } from './types'

export type ProfileResponse = Profile

export async function getProfile(signal?: AbortSignal) {
  const response = await get(`${API_URL}/profile`, {
    signal,
    headers: {
      Version: '2',
    },
  })
  if (response.error) {
    throw response.error
  }

  return response as ProfileResponse
}

export type ProfileData = Awaited<ReturnType<typeof getProfile>>
export type ProfileError = unknown

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
    }
  )
}

export const useProfilePrefetch = () => {
  const client = useQueryClient()

  return useCallback(() => {
    client.prefetchQuery(profileKeys.profile(), ({ signal }) => getProfile(signal))
  }, [])
}
