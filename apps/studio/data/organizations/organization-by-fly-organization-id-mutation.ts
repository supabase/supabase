import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

export type OrganizationByFlyOrgIdVariables = {
  flyOrganizationId: string
}

// [Joshen] Should be converted into a query instead of a mutation
// Will need to update sign-in-fly-tos.tsx as well

export async function getOrganizationByFlyOrgId({
  flyOrganizationId,
}: OrganizationByFlyOrgIdVariables) {
  const { data, error } = await get('/platform/organizations/fly/{fly_organization_id}', {
    params: { path: { fly_organization_id: flyOrganizationId } },
  })
  if (error) handleError(error)
  return data as { slug: string }
}

type OrganizationByFlyOrgIdData = Awaited<ReturnType<typeof getOrganizationByFlyOrgId>>

export const useOrganizationByFlyOrgIdMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrganizationByFlyOrgIdData, ResponseError, OrganizationByFlyOrgIdVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<OrganizationByFlyOrgIdData, ResponseError, OrganizationByFlyOrgIdVariables>(
    (vars) => getOrganizationByFlyOrgId(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to get organization: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
