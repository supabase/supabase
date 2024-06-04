import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { organizationKeys } from './keys'
import type { ResponseError } from 'types'

export type OrganizationCustomerProfileVariables = {
  slug?: string
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

  return data
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
