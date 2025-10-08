import type { UserIdentity } from '@supabase/supabase-js'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { auth } from 'lib/gotrue'
import { profileKeys } from './keys'

export async function getProfileIdentities() {
  const { error, data } = await auth.getUser()

  if (error) throw error

  const { identities = [], new_email, email_change_sent_at } = data.user
  return { identities, new_email, email_change_sent_at }
}

type ProfileIdentitiesData = {
  identities: (UserIdentity & { email?: string })[]
  new_email?: string
  email_change_sent_at?: string
}
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
