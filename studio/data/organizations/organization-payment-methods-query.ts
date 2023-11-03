import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { organizationKeys } from './keys'
import { ResponseError } from 'types'

export type OrganizationPaymentMethodsVariables = { slug?: string }
export type OrganizationPaymentMethod = {
  id: string
  customer: string
  type: string
  object: string
  metadata: any
  livemode: boolean
  created: number
  card: {
    brand: string
    country: string
    exp_month: number
    exp_year: number
    fingerprint: string
    last4: string
    funding: string
    // [Joshen] There's more but just putting what's relevant
  }
  billing_details: {
    address: any
    email: string | null
    name: string | null
    phone: string | null
  }
}

export async function getOrganizationPaymentMethods(
  { slug }: OrganizationPaymentMethodsVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const response = await get(`${API_URL}/organizations/${slug}/payments`, { signal })
  if (response.error) throw response.error

  return response.data as OrganizationPaymentMethod[]
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
