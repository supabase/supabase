import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { put, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'
import { components } from 'api-types'

export type OrganizationCustomerProfileUpdateVariables = {
  slug: string
  address?: components['schemas']['CustomerBillingAddress']
}

export async function updateOrganizationCustomerProfile({
  slug,
  address,
}: OrganizationCustomerProfileUpdateVariables) {
  if (!slug) return console.error('Slug is required')

  const payload: any = {}
  if (address) payload.address = address

  const { data, error } = await put(`/platform/organizations/{slug}/customer`, {
    params: {
      path: {
        slug,
      },
    },
    body: { address },
  })
  if (error) throw handleError(error)
  return data
}

type OrganizationCustomerProfileUpdateData = Awaited<
  ReturnType<typeof updateOrganizationCustomerProfile>
>

export const useOrganizationCustomerProfileUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationCustomerProfileUpdateData,
    ResponseError,
    OrganizationCustomerProfileUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationCustomerProfileUpdateData,
    ResponseError,
    OrganizationCustomerProfileUpdateVariables
  >((vars) => updateOrganizationCustomerProfile(vars), {
    async onSuccess(data, variables, context) {
      const { address, slug } = variables

      // We do not invalidate here as GET endpoint data is stale for 1-2 seconds, so we handle state manually
      queryClient.setQueriesData(organizationKeys.customerProfile(slug), (prev: any) => {
        if (!prev) return prev
        return {
          ...prev,
          address,
        }
      })

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update customer profile: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
