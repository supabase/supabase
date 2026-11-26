import { useMutation, useQueryClient } from '@tanstack/react-query'

import { handleError, post } from '@/data/fetchers'
import { invalidateOrganizationsQuery } from '@/data/organizations/organizations-query'
import { invalidatePermissionsQuery } from '@/data/permissions/permissions-query'
import { useInvalidateProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type OrganizationAcceptInvitationVariables = {
  slug: string
  token: string
}

export async function acceptOrganizationInvitation({
  slug,
  token,
}: OrganizationAcceptInvitationVariables) {
  const { data, error } = await post('/platform/organizations/{slug}/members/invitations/{token}', {
    params: { path: { slug, token } },
  })

  if (error) handleError(error)
  return data
}

type OrganizationMemberUpdateData = Awaited<ReturnType<typeof acceptOrganizationInvitation>>

export const useOrganizationAcceptInvitationMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<
    OrganizationMemberUpdateData,
    StudioError,
    OrganizationAcceptInvitationVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  const { invalidateProjectsQuery } = useInvalidateProjectsInfiniteQuery()

  return useMutation<
    OrganizationMemberUpdateData,
    StudioError,
    OrganizationAcceptInvitationVariables
  >({
    mutationFn: (vars) => acceptOrganizationInvitation(vars),
    async onSuccess(data, variables, context) {
      await Promise.all([
        invalidateOrganizationsQuery(queryClient),
        invalidateProjectsQuery(),
        invalidatePermissionsQuery(queryClient),
      ])
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
