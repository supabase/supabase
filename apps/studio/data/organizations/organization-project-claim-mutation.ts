import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

type OrganizationProjectClaimVariables = {
  slug: string
  token: string
}

async function claimOrganizationProject({ slug, token }: OrganizationProjectClaimVariables) {
  const { data, error } = await post('/v1/organizations/{slug}/project-claim/{token}', {
    params: { path: { slug, token } },
  })
  if (error) handleError(error)
  return data
}

type ClaimOrganizationProjectData = Awaited<ReturnType<typeof claimOrganizationProject>>

export const useOrganizationProjectClaimMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    ClaimOrganizationProjectData,
    ResponseError,
    OrganizationProjectClaimVariables
  >,
  'mutationFn'
> = {}) => {
  return useMutation<
    ClaimOrganizationProjectData,
    ResponseError,
    OrganizationProjectClaimVariables
  >((vars) => claimOrganizationProject(vars), {
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to claim project: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
