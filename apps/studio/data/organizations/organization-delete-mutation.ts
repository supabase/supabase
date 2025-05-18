import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import { permissionKeys } from 'data/permissions/keys'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationDeleteVariables = {
  slug: string
}

export async function deleteOrganization({ slug }: OrganizationDeleteVariables) {
  const { data, error } = await del('/platform/organizations/{slug}', {
    params: { path: { slug } },
  })
  if (error) handleError(error)
  return data
}

type OrganizationDeleteData = Awaited<ReturnType<typeof deleteOrganization>>

export const useOrganizationDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrganizationDeleteData, ResponseError, OrganizationDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrganizationDeleteData, ResponseError, OrganizationDeleteVariables>(
    (vars) => deleteOrganization(vars),
    {
      async onSuccess(data, variables, context) {
        await Promise.all([
          queryClient.invalidateQueries(organizationKeys.list()),
          queryClient.invalidateQueries(permissionKeys.list()),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete organization: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
