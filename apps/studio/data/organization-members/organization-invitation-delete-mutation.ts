import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys as organizationKeysV1 } from '../organizations/keys'
import { organizationKeys } from './keys'

export type OrganizationDeleteInvitationVariables = {
  slug: string
  id: number
  skipInvalidation?: boolean
}

export async function deleteOrganizationInvitation({
  slug,
  id,
}: OrganizationDeleteInvitationVariables) {
  const { error } = await del('/platform/organizations/{slug}/members/invitations/{id}', {
    params: { path: { slug, id } },
  })

  if (error) handleError(error)
  return true
}

type OrganizationDeleteInvitationData = Awaited<ReturnType<typeof deleteOrganizationInvitation>>

export const useOrganizationDeleteInvitationMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationDeleteInvitationData,
    ResponseError,
    OrganizationDeleteInvitationVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationDeleteInvitationData,
    ResponseError,
    OrganizationDeleteInvitationVariables
  >((vars) => deleteOrganizationInvitation(vars), {
    async onSuccess(data, variables, context) {
      const { slug, skipInvalidation } = variables

      if (!skipInvalidation) {
        await Promise.all([
          queryClient.invalidateQueries(organizationKeys.rolesV2(slug)),
          queryClient.invalidateQueries(organizationKeysV1.members(slug)),
        ])
      }

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete invitation: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
