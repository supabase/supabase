import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get, post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { profileKeys } from './keys'
import Telemetry from 'lib/telemetry'

export type Profile = {
  id: number
  auth0_id: string
  primary_email: string
  username: string
  first_name: string
  last_name: string
  mobile: string | null
  is_alpha_user: boolean
  gotrue_id: string
  free_project_limit: number
}

export type ProfileResponse = Profile

/**
 * Create profile for new user
 * This will also need to send a sign_up event
 */
async function createProfile() {
  const response = await post(`${API_URL}/profile`, {})
  if (response.error) {
    throw response.error
  }

  Telemetry.sendEvent(
    { category: 'conversion', action: 'sign_up', label: '' },
    {
      screenResolution:
        typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
      language: 'en-US',
    }
  )

  return response
}

export async function getProfile(signal?: AbortSignal) {
  const response = await get(`${API_URL}/profile`, {
    signal,
  })
  if (response.error) {
    // if response.error is not found
    // we need to send request to create new user profile
    if (response.error.code === 404) return await createProfile()
    throw response.error
  }

  return response as ProfileResponse
}

export type ProfileData = Awaited<ReturnType<typeof getProfile>>
export type ProfileError = unknown

export const useProfileQuery = <TData = ProfileData>({
  enabled = true,
  ...options
}: UseQueryOptions<ProfileData, ProfileError, TData> = {}) =>
  useQuery<ProfileData, ProfileError, TData>(
    profileKeys.profile(),
    ({ signal }) => getProfile(signal),
    {
      staleTime: 1000 * 60 * 30, // default good for 30 mins
      ...options,
    }
  )

export const useProfilePrefetch = () => {
  const client = useQueryClient()

  return useCallback(() => {
    client.prefetchQuery(profileKeys.profile(), ({ signal }) => getProfile(signal))
  }, [])
}
