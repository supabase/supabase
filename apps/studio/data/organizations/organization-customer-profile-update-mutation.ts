import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, put } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { organizationKeys } from './keys'
import type { CustomerAddress } from './types'

export type OrganizationCustomerProfileUpdateVariables = {
  slug?: string
  address?: CustomerAddress
  billing_name: string
}

export async function updateOrganizationCustomerProfile({
  slug,
  address,
  billing_name,
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
    body: { address: address != null ? address : undefined, billing_name },
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
  UseCustomMutationOptions<
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
  >({
    mutationFn: (vars) => updateOrganizationCustomerProfile(vars),
    async onSuccess(data, variables, context) {
      const { address, slug, billing_name } = variables

      // We do not invalidate here as GET endpoint data is stale for 1-2 seconds, so we handle state manually
      queryClient.setQueriesData(
        { queryKey: organizationKeys.customerProfile(slug) },
        (prev: any) => {
          if (!prev) return prev
          return {
            ...prev,
            billing_name,
            address,
          }
        }
      )

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
