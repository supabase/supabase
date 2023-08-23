import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationJoinVariables = {
  slug: string
  token: string
}

export async function joinOrganization({ slug, token }: OrganizationJoinVariables) {
  const { data, error } = await post('/platform/organizations/{slug}/members/join', {
    params: { path: { slug }, query: { token } },
  })
  if (error) throw error
  return data
}

type OrganizationJoinData = Awaited<ReturnType<typeof joinOrganization>>

export const useOrganizationJoinMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrganizationJoinData, ResponseError, OrganizationJoinVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrganizationJoinData, ResponseError, OrganizationJoinVariables>(
    (vars) => joinOrganization(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(organizationKeys.list())
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to join organization: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
