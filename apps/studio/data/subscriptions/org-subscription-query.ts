import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { subscriptionKeys } from './keys'

export type OrgSubscriptionVariables = {
  orgSlug?: string
}

export async function getOrgSubscription(
  { orgSlug }: OrgSubscriptionVariables,
  signal?: AbortSignal,
  headers?: Record<string, string>
) {
  if (!orgSlug) throw new Error('orgSlug is required')

  const { error, data } = await get('/platform/organizations/{slug}/billing/subscription', {
    params: { path: { slug: orgSlug } },
    signal,
    headers,
  })

  if (error) handleError(error)
  return data
}

export type OrgSubscriptionData = Awaited<ReturnType<typeof getOrgSubscription>>
export type OrgSubscriptionError = ResponseError

export const useOrgSubscriptionQuery = <TData = OrgSubscriptionData>(
  { orgSlug }: OrgSubscriptionVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OrgSubscriptionData, OrgSubscriptionError, TData> = {}
) => {
  // [Joshen] Thinking it makes sense to add this check at the RQ level - prevent
  // unnecessary requests, although this behaviour still needs handling on the UI
  const { can: canReadSubscriptions } = useAsyncCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  return useQuery<OrgSubscriptionData, OrgSubscriptionError, TData>({
    queryKey: subscriptionKeys.orgSubscription(orgSlug),
    queryFn: ({ signal }) => getOrgSubscription({ orgSlug }, signal),
    enabled: enabled && canReadSubscriptions && typeof orgSlug !== 'undefined',
    staleTime: 60 * 60 * 1000,
    ...options,
  })
}

export const useHasAccessToProjectLevelPermissions = (slug: string) => {
  const { hasAccess } = useCheckEntitlements('project_scoped_roles', slug)
  return hasAccess
}
