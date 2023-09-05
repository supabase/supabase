import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationCustomerProfileUpdateVariables = {
  slug: string
  address?: {
    city: string | null
    country: string | null
    line1: string | null
    line2: string | null
    postal_code: string | null
    state: string | null
  } | null
  invoice_settings?: {
    default_payment_method: string
  }
}

export async function updateOrganizationCustomerProfile({
  slug,
  address,
  invoice_settings,
}: OrganizationCustomerProfileUpdateVariables) {
  if (!slug) return console.error('Slug is required')

  const payload: any = {}
  if (address) payload.address = address
  if (invoice_settings) payload.invoice_settings = invoice_settings

  const response = await patch(`${API_URL}/organizations/${slug}/customer`, payload)
  if (response.error) throw response.error
  return response
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
      const { slug } = variables
      await queryClient.invalidateQueries(organizationKeys.customerProfile(slug))
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
