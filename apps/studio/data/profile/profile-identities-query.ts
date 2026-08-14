import type { UserIdentity } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'

import { profileKeys } from './keys'
import { auth } from '@/lib/gotrue'
import { UseCustomQueryOptions } from '@/types'

export async function getProfileIdentities() {
  // getUser() is used instead of getSession() here because the client is configured
  // with a `userStorage` option, under which getSession() can return a session whose
  // `user` is a placeholder that throws when any of its properties are read.
  const { error, data } = await auth.getUser()

  if (error) throw error
  if (!data.user) throw new Error('User not found with getUser()')

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
}: UseCustomQueryOptions<ProfileIdentitiesData, ProfileIdentitiesError, TData> = {}) => {
  return useQuery<ProfileIdentitiesData, ProfileIdentitiesError, TData>({
    queryKey: profileKeys.identities(),
    queryFn: () => getProfileIdentities(),
    ...options,
  })
}
