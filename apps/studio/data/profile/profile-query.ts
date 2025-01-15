import { createQuery } from 'react-query-kit'

import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'
import type { Profile } from './types'

export async function getProfile(_: void, { signal }: { signal: AbortSignal }) {
  const { data, error } = await get('/platform/profile', {
    signal,
    headers: { Version: '2' },
  })

  if (error) handleError(error)

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
export type ProfileError = ResponseError

export const useProfileQuery = createQuery<ProfileData, void, ProfileError>({
  queryKey: ['profile'],
  fetcher: getProfile,
  staleTime: 1000 * 60 * 30, // default good for 30 mins
})
