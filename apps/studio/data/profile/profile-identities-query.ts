import type { UserIdentity } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'

import { auth } from 'lib/gotrue'
import { profileKeys } from './keys'
import { UseCustomQueryOptions } from 'types'

export async function getProfileIdentities() {
  // getSession() uses a cached user object, which is almost never stale as the
  // session refresh logic keeps it fresh. If there are claims of data not being
  // fresh, it's because it was modified on another device / browser and the
  // session hasn't been refreshed yet.
  const { error, data } = await auth.getSession()

  if (error) throw error
  if (!data.session) throw new Error('Session not found with getSession()')

  const { identities = [], new_email, email_change_sent_at } = data.session.user
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
}: UseCustomQueryOptions<ProfileIdentitiesData, ProfileIdentitiesError, TData> = {}) => {
  return useQuery<ProfileIdentitiesData, ProfileIdentitiesError, TData>({
    queryKey: profileKeys.identities(),
    queryFn: () => getProfileIdentities(),
    ...options,
  })
}
