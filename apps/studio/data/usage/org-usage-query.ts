import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { usageKeys } from './keys'

export type OrgUsageVariables = {
  orgSlug?: string
  projectRef?: string
  start?: Date
  end?: Date
}

export type OrgUsageResponse = components['schemas']['OrgUsageResponse']
export type OrgMetricsUsage = components['schemas']['OrgMetricUsage']

export async function getOrgUsage(
  { orgSlug, projectRef, start, end }: OrgUsageVariables,
  signal?: AbortSignal
): Promise<OrgUsageResponse> {
  if (!orgSlug) throw new Error('orgSlug is required')
  const { data, error } = await get(`/platform/organizations/{slug}/usage`, {
    params: {
      path: { slug: orgSlug },
      query: { project_ref: projectRef, start: start?.toISOString(), end: end?.toISOString() },
    },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type OrgUsageData = Awaited<ReturnType<typeof getOrgUsage>>
export type OrgUsageError = ResponseError

export const useOrgUsageQuery = <TData = OrgUsageData>(
  { orgSlug, projectRef, start, end }: OrgUsageVariables,
  { enabled = true, ...options }: UseQueryOptions<OrgUsageData, OrgUsageError, TData> = {}
) =>
  useQuery<OrgUsageData, OrgUsageError, TData>(
    usageKeys.orgUsage(orgSlug, projectRef, start?.toISOString(), end?.toISOString()),
    ({ signal }) => getOrgUsage({ orgSlug, projectRef, start, end }, signal),
    {
      enabled: enabled && typeof orgSlug !== 'undefined',
      staleTime: 1000 * 60 * 30, // 30 mins, underlying usage data only refreshes once an hour, so safe to cache for a while
      ...options,
    }
  )
