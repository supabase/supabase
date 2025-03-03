import type { UserIdentity } from '@supabase/supabase-js'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { auth } from 'lib/gotrue'
import { profileKeys } from './keys'

export async function getProfileIdentities() {
  const { error, data } = await auth.getUserIdentities()
  if (error) throw error
  return data
}

type ProfileIdentitiesData = { identities: UserIdentity[] }
type ProfileIdentitiesError = any

export const useProfileIdentitiesQuery = <TData = ProfileIdentitiesData>({
  enabled = true,
  ...options
}: UseQueryOptions<ProfileIdentitiesData, ProfileIdentitiesError, TData> = {}) => {
  return useQuery<ProfileIdentitiesData, ProfileIdentitiesError, TData>(
    profileKeys.identities(),
    () => getProfileIdentities(),
    { ...options }
  )
}
