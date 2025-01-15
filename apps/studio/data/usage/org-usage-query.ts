import { createQuery } from 'react-query-kit'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

export type OrgUsageVariables = {
  orgSlug: string
  projectRef?: string
  start?: Date
  end?: Date
}

export type OrgUsageResponse = components['schemas']['OrgUsageResponse']
export type OrgMetricsUsage = components['schemas']['OrgMetricUsage']

export async function getOrgUsage(
  { orgSlug, projectRef, start, end }: OrgUsageVariables,
  { signal }: { signal: AbortSignal }
): Promise<OrgUsageResponse> {
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

export const useOrgUsageQuery = createQuery<OrgUsageData, OrgUsageVariables, OrgUsageError>({
  queryKey: ['organizations', 'usage'],
  fetcher: getOrgUsage,
  staleTime: 1000 * 60 * 30, // 30 mins, underlying usage data only refreshes once an hour, so safe to cache for a while
})
