import { PermissionAction } from '@supabase/shared-types/out/constants'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { subscriptionKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type OrgCreditsBurndownVariables = {
  orgSlug?: string
  startDate: string
  endDate: string
}

export async function getOrgCreditsBurndown(
  { orgSlug, startDate, endDate }: OrgCreditsBurndownVariables,
  signal?: AbortSignal,
  headers?: Record<string, string>
) {
  if (!orgSlug) throw new Error('orgSlug is required')

  const { error, data } = await get('/platform/organizations/{slug}/billing/credits/burndown', {
    params: { path: { slug: orgSlug }, query: { start_date: startDate, end_date: endDate } },
    signal,
    headers,
  })

  if (error) handleError(error)
  return data
}

export type OrgCreditsBurndownData = Awaited<ReturnType<typeof getOrgCreditsBurndown>>
export type OrgCreditsBurndownError = ResponseError

export const useOrgCreditsBurndownQuery = <TData = OrgCreditsBurndownData>(
  { orgSlug, startDate, endDate }: OrgCreditsBurndownVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OrgCreditsBurndownData, OrgCreditsBurndownError, TData> = {}
) => {
  const { can: canReadBalance } = useAsyncCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  return useQuery<OrgCreditsBurndownData, OrgCreditsBurndownError, TData>({
    queryKey: subscriptionKeys.orgCreditsBurndown(orgSlug, startDate, endDate),
    queryFn: ({ signal }) => getOrgCreditsBurndown({ orgSlug, startDate, endDate }, signal),
    enabled: enabled && canReadBalance && typeof orgSlug !== 'undefined',
    placeholderData: keepPreviousData,
    ...options,
  })
}
