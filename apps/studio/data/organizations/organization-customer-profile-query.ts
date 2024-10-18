import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

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
) => {
  // [Joshen] Thinking it makes sense to add this check at the RQ level - prevent
  // unnecessary requests, although this behaviour still needs handling on the UI
  const canReadCustomerProfile = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.customer'
  )

  return useQuery<OrganizationCustomerProfileData, OrganizationCustomerProfileError, TData>(
    organizationKeys.customerProfile(slug),
    ({ signal }) => getOrganizationCustomerProfile({ slug }, signal),
    {
      enabled: enabled && canReadCustomerProfile && typeof slug !== 'undefined',
      ...options,
    }
  )
}
