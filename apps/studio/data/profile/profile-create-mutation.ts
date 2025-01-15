import { createMutation } from 'react-query-kit'
import { toast } from 'sonner'

import { post } from 'data/fetchers'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { getQueryClient } from 'data/query-client'
import type { ResponseError } from 'types'
import { useProfileQuery } from './profile-query'

export async function createProfile() {
  const { data, error } = await post(`/platform/profile`, {})
  if (error) {
    throw error
  }

  return data
}

type ProfileCreateData = Awaited<ReturnType<typeof createProfile>>

export const useProfileCreateMutation = createMutation<ProfileCreateData, void, ResponseError>({
  mutationFn: createProfile,
  async onSuccess() {
    const queryClient = getQueryClient()

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: useProfileQuery.getKey() }),
      queryClient.invalidateQueries({ queryKey: useOrganizationsQuery.getKey() }),
      queryClient.invalidateQueries({ queryKey: usePermissionsQuery.getKey() }),
    ])
  },
  onError(data) {
    toast.error(`Failed to create profile: ${data.message}`)
  },
})
