import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { subscriptionKeys } from './keys'
import type { ResponseError } from 'types'

export type OrgSubscriptionVariables = {
  orgSlug?: string
}

export async function getOrgSubscription(
  { orgSlug }: OrgSubscriptionVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')

  const { error, data } = await get('/platform/organizations/{slug}/billing/subscription', {
    params: { path: { slug: orgSlug } },
    signal,
  })

  if (error) throw error
  return data
}

export type OrgSubscriptionData = Awaited<ReturnType<typeof getOrgSubscription>>
export type OrgSubscriptionError = ResponseError

export const useOrgSubscriptionQuery = <TData = OrgSubscriptionData>(
  { orgSlug }: OrgSubscriptionVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrgSubscriptionData, OrgSubscriptionError, TData> = {}
) =>
  useQuery<OrgSubscriptionData, OrgSubscriptionError, TData>(
    subscriptionKeys.orgSubscription(orgSlug),
    ({ signal }) => getOrgSubscription({ orgSlug }, signal),
    {
      enabled: enabled && typeof orgSlug !== 'undefined',
      ...options,
    }
  )
