import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQuery } from '@tanstack/react-query'

import { IS_PLATFORM } from 'common'
import { get, handleError } from 'data/fetchers'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import type { ResponseError, UseCustomQueryOptions } from 'types'
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
  }: UseCustomQueryOptions<
    OrganizationCustomerProfileData,
    OrganizationCustomerProfileError,
    TData
  > = {}
) => {
  // [Joshen] Thinking it makes sense to add this check at the RQ level - prevent
  // unnecessary requests, although this behaviour still needs handling on the UI
  const { can: canReadCustomerProfile } = useAsyncCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.customer',
    undefined,
    { organizationSlug: slug }
  )

  return useQuery<OrganizationCustomerProfileData, OrganizationCustomerProfileError, TData>({
    queryKey: organizationKeys.customerProfile(slug),
    queryFn: ({ signal }) => getOrganizationCustomerProfile({ slug }, signal),
    enabled: IS_PLATFORM && enabled && canReadCustomerProfile && typeof slug !== 'undefined',
    ...options,
  })
}
