import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import { permissionKeys } from 'data/permissions/keys'
import { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationCreateVariables = {
  name: string
  kind?: string
  size?: string
  tier?: string
  payment_method?: string
}

export async function createOrganization({
  name,
  kind,
  size,
  tier,
  payment_method,
}: OrganizationCreateVariables) {
  const { data, error } = await post('/platform/organizations', {
    body: {
      name,
      // @ts-ignore [Joshen] Generated API spec is wrong
      kind,
      size,
      tier,
      payment_method,
    },
  })

  if (error) throw error
  return data
}

type OrganizationCreateData = Awaited<ReturnType<typeof createOrganization>>

export const useOrganizationCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrganizationCreateData, ResponseError, OrganizationCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrganizationCreateData, ResponseError, OrganizationCreateVariables>(
    (vars) => createOrganization(vars),
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
          toast.error(`Failed to create organization: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
