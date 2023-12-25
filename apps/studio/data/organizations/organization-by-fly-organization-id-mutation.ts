import { useMutation, UseMutationOptions } from '@tanstack/react-query'

import { get } from 'data/fetchers'
import toast from 'react-hot-toast'
import { ResponseError } from 'types'

export type OrganizationByFlyOrgIdVariables = {
  flyOrganizationId: string
}

export async function getOrganizationByFlyOrgId({
  flyOrganizationId,
}: OrganizationByFlyOrgIdVariables) {
  const { data, error } = await get('/platform/organizations/fly/{fly_organization_id}', {
    params: { path: { fly_organization_id: flyOrganizationId } },
  })
  if (error) throw error
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
