import { useQuery } from '@tanstack/react-query'
import { components } from 'api-types'

import { organizationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type OrganizationPaymentMethodsVariables = { slug?: string }
export type OrganizationPaymentMethod = components['schemas']['PaymentsResponse_Output']['data'][0]

export async function getOrganizationPaymentMethods(
  { slug }: OrganizationPaymentMethodsVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get(`/platform/organizations/{slug}/payments`, {
    params: {
      path: {
        slug,
      },
    },
    headers: {
      Version: '2',
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type OrganizationPaymentMethodsData = Awaited<
  ReturnType<typeof getOrganizationPaymentMethods>
>
export type OrganizationPaymentMethodsError = ResponseError

export const useOrganizationPaymentMethodsQuery = <TData = OrganizationPaymentMethodsData>(
  { slug }: OrganizationPaymentMethodsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    OrganizationPaymentMethodsData,
    OrganizationPaymentMethodsError,
    TData
  > = {}
) => {
  const { can: canReadSubscriptions } = useAsyncCheckPermissionsV2('billing_read')
  return useQuery<OrganizationPaymentMethodsData, OrganizationPaymentMethodsError, TData>({
    queryKey: organizationKeys.paymentMethods(slug),
    queryFn: ({ signal }) => getOrganizationPaymentMethods({ slug }, signal),
    enabled: enabled && typeof slug !== 'undefined' && canReadSubscriptions,
    ...options,
  })
}
