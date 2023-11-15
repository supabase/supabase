import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { usageKeys } from './keys'
import { ResponseError } from 'types'
import { PricingMetric } from 'data/analytics/org-daily-stats-query'

export type OrgUsageVariables = {
  orgSlug?: string
}

export interface UsageMetric {
  /** Determines if the metric is available based on the plan */
  available_in_plan: boolean
  cost: number
  metric: PricingMetric
  unlimited: boolean
  /** Determines if over-usage is allowed or not */
  capped: boolean
  /** Refers to the included quota, in GB by default for bytes */
  pricing_free_units?: number
  pricing_package_price?: number
  pricing_package_size?: number
  pricing_per_unit_price?: number
  pricing_strategy: 'UNIT' | 'PACKAGE' | 'NONE'
  usage: number
}

export type OrgUsageResponse = {
  slugs: string[]
  usage_billing_enabled: boolean
  usages: UsageMetric[]
}

export async function getOrgUsage({ orgSlug }: OrgUsageVariables, signal?: AbortSignal) {
  if (!orgSlug) throw new Error('orgSlug is required')
  const response = await get(`${API_URL}/organizations/${orgSlug}/usage`, { signal })
  if (response.error) throw response.error
  return response as OrgUsageResponse
}

export type OrgUsageData = Awaited<ReturnType<typeof getOrgUsage>>
export type OrgUsageError = ResponseError

export const useOrgUsageQuery = <TData = OrgUsageData>(
  { orgSlug }: OrgUsageVariables,
  { enabled = true, ...options }: UseQueryOptions<OrgUsageData, OrgUsageError, TData> = {}
) =>
  useQuery<OrgUsageData, OrgUsageError, TData>(
    usageKeys.orgUsage(orgSlug),
    ({ signal }) => getOrgUsage({ orgSlug }, signal),
    {
      enabled: enabled && typeof orgSlug !== 'undefined',
      ...options,
    }
  )
