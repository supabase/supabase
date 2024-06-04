import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { organizationKeys } from './keys'
import type { ResponseError } from 'types'
import { get, handleError } from 'data/fetchers'
import { components } from 'api-types'

export type OrganizationPaymentMethodsVariables = { slug?: string }
export type OrganizationPaymentMethodsResponse = components['schemas']['PaymentsResponseV2']
export type OrganizationPaymentMethod = components['schemas']['PaymentV2']

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

  // Due to API versioning, this is not correctly recognized until the old endpoint is removed
  // @ts-ignore
  return data as OrganizationPaymentMethodsResponse
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
  }: UseQueryOptions<OrganizationPaymentMethodsData, OrganizationPaymentMethodsError, TData> = {}
) =>
  useQuery<OrganizationPaymentMethodsData, OrganizationPaymentMethodsError, TData>(
    organizationKeys.paymentMethods(slug),
    ({ signal }) => getOrganizationPaymentMethods({ slug }, signal),
    { enabled: enabled, ...options }
  )
