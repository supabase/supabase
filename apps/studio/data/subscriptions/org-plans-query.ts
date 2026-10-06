import { useQuery } from '@tanstack/react-query'

import { subscriptionKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import { UseCustomQueryOptions } from '@/types'

export type OrgPlansVariables = {
  orgSlug?: string
}

export async function getOrgPlans({ orgSlug }: OrgPlansVariables, signal?: AbortSignal) {
  if (!orgSlug) throw new Error('orgSlug is required')

  const { error, data } = await get('/platform/organizations/{slug}/billing/plans', {
    params: { path: { slug: orgSlug } },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type OrgPlansData = Awaited<ReturnType<typeof getOrgPlans>>
export type OrgPlansError = unknown

export const useOrgPlansQuery = <TData = OrgPlansData>(
  { orgSlug }: OrgPlansVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<OrgPlansData, OrgPlansError, TData> = {}
) => {
  const { can: canReadSubscriptions } = useAsyncCheckPermissionsV2(FGA_PERMISSIONS.ORGANIZATION.BILLING_READ)

  return useQuery<OrgPlansData, OrgPlansError, TData>({
    queryKey: subscriptionKeys.orgPlans(orgSlug),
    queryFn: ({ signal }) => getOrgPlans({ orgSlug }, signal),
    enabled: enabled && typeof orgSlug !== 'undefined' && canReadSubscriptions,
    ...options,
  })
}
