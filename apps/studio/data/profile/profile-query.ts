import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { profileKeys } from './keys'
import type { Profile } from './types'

export async function getProfile(signal?: AbortSignal) {
  const { data, error } = await get('/platform/profile', {
    signal,
    headers: { Version: '2' },
  })

  if (error) handleError(error)

  return data as Profile
}

export type ProfileData = Awaited<ReturnType<typeof getProfile>>
export type ProfileError = ResponseError

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
