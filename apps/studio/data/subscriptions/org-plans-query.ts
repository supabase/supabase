import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { UseCustomQueryOptions } from 'types'
import { subscriptionKeys } from './keys'

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
  const { can: canReadSubscriptions } = useAsyncCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  return useQuery<OrgPlansData, OrgPlansError, TData>({
    queryKey: subscriptionKeys.orgPlans(orgSlug),
    queryFn: ({ signal }) => getOrgPlans({ orgSlug }, signal),
    enabled: enabled && typeof orgSlug !== 'undefined' && canReadSubscriptions,
    ...options,
  })
}
