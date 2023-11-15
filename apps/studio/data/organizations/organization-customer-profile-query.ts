import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { organizationKeys } from './keys'
import { ResponseError } from 'types'

export type OrganizationCustomerProfileVariables = {
  slug?: string
}

export type OrganizationCustomerProfileResponse = {
  address: {
    city: string | null
    country: string | null
    line1: string | null
    line2: string | null
    postal_code: string | null
    state: string | null
  } | null
  balance: number
  email: string
  id: string
  invoice_settings: {
    default_payment_method: string | null
  }
}

export async function getOrganizationCustomerProfile(
  { slug }: OrganizationCustomerProfileVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const data = await get(`${API_URL}/organizations/${slug}/customer`, { signal })
  if (data.error) throw data.error

  return data as OrganizationCustomerProfileResponse
}

export type OrganizationCustomerProfileData = Awaited<
  ReturnType<typeof getOrganizationCustomerProfile>
>
export type OrganizationCustomerProfileError = ResponseError

export const useOrganizationCustomerProfileQuery = <TData = OrganizationCustomerProfileData>(
  { slug }: OrganizationCustomerProfileVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrganizationCustomerProfileData, OrganizationCustomerProfileError, TData> = {}
) =>
  useQuery<OrganizationCustomerProfileData, OrganizationCustomerProfileError, TData>(
    organizationKeys.customerProfile(slug),
    ({ signal }) => getOrganizationCustomerProfile({ slug }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )
