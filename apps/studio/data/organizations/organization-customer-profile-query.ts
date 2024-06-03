import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { organizationKeys } from './keys'
import type { ResponseError } from 'types'

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
}

export async function getOrganizationCustomerProfile(
  { slug }: OrganizationCustomerProfileVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get(`/platform/organizations/{slug}/customer`, {
    params: {
      path: {
        slug,
      },
    },
    signal,
  })
  if (error) handleError(error)

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
