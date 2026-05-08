import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQuery } from '@tanstack/react-query'

import { subscriptionKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type OrgBalanceVariables = {
  orgSlug?: string
}

export async function getOrgBalance(
  { orgSlug }: OrgBalanceVariables,
  signal?: AbortSignal,
  headers?: Record<string, string>
) {
  if (!orgSlug) throw new Error('orgSlug is required')

  const { error, data } = await get('/platform/organizations/{slug}/billing/credits/balance', {
    params: { path: { slug: orgSlug } },
    signal,
    headers,
  })

  if (error) handleError(error)
  return data
}

export type OrgBalanceData = Awaited<ReturnType<typeof getOrgBalance>>
export type OrgBalanceError = ResponseError

export const useOrgBalanceQuery = <TData = OrgBalanceData>(
  { orgSlug }: OrgBalanceVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<OrgBalanceData, OrgBalanceError, TData> = {}
) => {
  // [Joshen] Thinking it makes sense to add this check at the RQ level - prevent
  // unnecessary requests, although this behaviour still needs handling on the UI
  const { can: canReadBalance } = useAsyncCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  return useQuery<OrgBalanceData, OrgBalanceError, TData>({
    queryKey: subscriptionKeys.orgBalance(orgSlug),
    queryFn: ({ signal }) => getOrgBalance({ orgSlug }, signal),
    enabled: enabled && canReadBalance && typeof orgSlug !== 'undefined',
    staleTime: 60 * 60 * 1000,
    ...options,
  })
}
