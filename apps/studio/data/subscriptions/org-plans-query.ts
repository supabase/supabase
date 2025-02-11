import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { subscriptionKeys } from './keys'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { PermissionAction } from '@supabase/shared-types/out/constants'

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
  { enabled = true, ...options }: UseQueryOptions<OrgPlansData, OrgPlansError, TData> = {}
) => {
  const canReadSubscriptions = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )

  return useQuery<OrgPlansData, OrgPlansError, TData>(
    subscriptionKeys.orgPlans(orgSlug),
    ({ signal }) => getOrgPlans({ orgSlug }, signal),
    {
      enabled: enabled && typeof orgSlug !== 'undefined' && canReadSubscriptions,
      ...options,
    }
  )
}
