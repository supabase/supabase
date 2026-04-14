import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { organizationKeys } from './keys'
import type { CustomerAddress, CustomerTaxId } from './types'
import { handleError, put } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type OrganizationCustomerProfileUpdateVariables = {
  slug?: string
  address?: CustomerAddress
  billing_name: string
  /** Pass a tax ID object to set/update, `null` to clear, or `undefined` to leave unchanged */
  tax_id?: CustomerTaxId | null
}

export async function updateOrganizationCustomerProfile({
  slug,
  address,
  billing_name,
  tax_id,
}: OrganizationCustomerProfileUpdateVariables) {
  if (!slug) return console.error('Slug is required')

  const { data, error } = await put(`/platform/organizations/{slug}/customer`, {
    params: {
      path: {
        slug,
      },
    },
    body: {
      address: address != null ? address : undefined,
      billing_name,
      ...(tax_id === null
        ? { clear_tax_id: true as const }
        : tax_id !== undefined
          ? { tax_id }
          : {}),
    },
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
      const { address, slug, billing_name, tax_id } = variables

      // We do not invalidate here as GET endpoint data is stale for 1-2 seconds, so we handle state manually
      queryClient.setQueriesData(
        { queryKey: organizationKeys.customerProfile(slug) },
        (prev: any) => {
          if (!prev) return prev
          return {
            ...prev,
            billing_name,
            ...(address !== undefined ? { address } : {}),
          }
        }
      )

      // Update tax ID cache if tax_id was part of this update
      if (tax_id !== undefined) {
        queryClient.setQueryData(organizationKeys.taxId(slug), tax_id)
      }

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
