import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { usageKeys } from './keys'

export type OrgUsageVariables = {
  orgSlug?: string
}

export interface UsageMetric {
  usage: number
  limit: number
  cost: number
  available_in_plan: boolean
  // [Joshen] can we verify if this is still getting passed?
  // Only for database and storage size
  current?: number
}

// [Joshen TODO] Go update this
export type OrgUsageResponse = {
  db_size: UsageMetric
  db_egress: UsageMetric
  storage_size: UsageMetric
  storage_egress: UsageMetric
  storage_image_render_count: UsageMetric
  monthly_active_users: UsageMetric
  monthly_active_sso_users: UsageMetric
  realtime_message_count: UsageMetric
  realtime_peak_connection: UsageMetric
  func_count: UsageMetric
  func_invocations: UsageMetric
  disk_volume_size_gb: number
}

export type OrgUsageResponseUsageKeys = keyof Omit<OrgUsageResponse, 'disk_volume_size_gb'>

export async function getOrgUsage({ orgSlug }: OrgUsageVariables, signal?: AbortSignal) {
  if (!orgSlug) throw new Error('orgSlug is required')
  const response = await get(`${API_URL}/organizations/${orgSlug}/usage`, { signal })
  if (response.error) throw response.error
  return response as OrgUsageResponse
}

export type OrgUsageData = Awaited<ReturnType<typeof getOrgUsage>>
export type OrgUsageError = unknown

export const useOrgUsageQuery = <TData = OrgUsageData>(
  { orgSlug }: OrgUsageVariables,
  { enabled = true, ...options }: UseQueryOptions<OrgUsageData, OrgUsageError, TData> = {}
) =>
  useQuery<OrgUsageData, OrgUsageError, TData>(
    usageKeys.orgUsage(orgSlug),
    ({ signal }) => getOrgUsage({ orgSlug }, signal),
    {
      enabled: enabled && typeof orgSlug !== 'undefined',
      // select(data) {
      //   return Object.fromEntries(
      //     Object.entries(data).map(([key, value]) => {
      //       if (typeof value === 'object') {
      //         const formattedValue = {
      //           ...value,
      //           usage: Number(value.usage),
      //         }

      //         return [key, formattedValue]
      //       } else {
      //         return [key, value]
      //       }
      //     })
      //   )
      // },
      ...options,
    }
  )

export const useOrgUsagePrefetch = ({ orgSlug }: OrgUsageVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (orgSlug) {
      client.prefetchQuery(usageKeys.orgUsage(orgSlug), ({ signal }) =>
        getOrgUsage({ orgSlug }, signal)
      )
    }
  }, [orgSlug])
}
