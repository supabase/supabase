import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'
import { usageKeys } from './keys'

export type OrgUsageVariables = {
  orgSlug?: string
  projectRef?: string
  start?: Date
  end?: Date
}

export type OrgUsageResponse = components['schemas']['OrgUsageResponse']
export type OrgMetricsUsage = components['schemas']['OrgUsageResponse']['usages'][0]

export async function getOrgUsage(
  { orgSlug, projectRef, start, end }: OrgUsageVariables,
  signal?: AbortSignal
): Promise<OrgUsageResponse> {
  if (!orgSlug) throw new Error('orgSlug is required')
  // const { data, error } = await get(`/platform/organizations/{slug}/usage`, {
  //   params: {
  //     path: { slug: orgSlug },
  //     query: { project_ref: projectRef, start: start?.toISOString(), end: end?.toISOString() },
  //   },
  //   signal,
  // })
  // if (error) handleError(error)
  const data = {
    "usage_billing_enabled": false,
    "usages": [
      {
        "usage": 0,
        "usage_original": 0,
        "metric": "MONTHLY_ACTIVE_USERS",
        "cost": 0,
        "unit_price_desc": "50,000 MAU included",
        "available_in_plan": true,
        "unlimited": false,
        "capped": true,
        "pricing_strategy": "NONE",
        "pricing_free_units": 50000,
        "pricing_per_unit_price": 0,
        "project_allocations": []
      },
      {
        "usage": 0,
        "usage_original": 0,
        "metric": "FUNCTION_INVOCATIONS",
        "cost": 0,
        "unit_price_desc": "500,000 invocations included",
        "available_in_plan": true,
        "unlimited": false,
        "capped": true,
        "pricing_strategy": "NONE",
        "pricing_free_units": 500000,
        "pricing_per_unit_price": 0,
        "project_allocations": []
      },
      {
        "usage": 0,
        "usage_original": 0,
        "metric": "MONTHLY_ACTIVE_THIRD_PARTY_USERS",
        "cost": 0,
        "unit_price_desc": "50 MAU included",
        "available_in_plan": true,
        "unlimited": false,
        "capped": true,
        "pricing_strategy": "NONE",
        "pricing_free_units": 50,
        "pricing_per_unit_price": 0,
        "project_allocations": []
      },
      {
        "usage": 0,
        "usage_original": 0,
        "metric": "REALTIME_MESSAGE_COUNT",
        "cost": 0,
        "unit_price_desc": "2 Million messages included",
        "available_in_plan": true,
        "unlimited": false,
        "capped": true,
        "pricing_strategy": "NONE",
        "pricing_free_units": 2000000,
        "pricing_per_unit_price": 0,
        "project_allocations": []
      },
      {
        "usage": 0,
        "usage_original": 0,
        "metric": "EGRESS",
        "cost": 0,
        "unit_price_desc": "5 GB included",
        "available_in_plan": true,
        "unlimited": false,
        "capped": true,
        "pricing_strategy": "NONE",
        "pricing_free_units": 5,
        "pricing_per_unit_price": 0,
        "project_allocations": []
      },
      {
        "usage": 0,
        "usage_original": 0,
        "metric": "REALTIME_PEAK_CONNECTIONS",
        "cost": 0,
        "unit_price_desc": "200 connections included",
        "available_in_plan": true,
        "unlimited": false,
        "capped": true,
        "pricing_strategy": "NONE",
        "pricing_free_units": 200,
        "pricing_per_unit_price": 0,
        "project_allocations": []
      },
      {
        "usage": 0,
        "usage_original": 0,
        "metric": "STORAGE_SIZE",
        "cost": 0,
        "unit_price_desc": "1 GB included",
        "available_in_plan": true,
        "unlimited": false,
        "capped": true,
        "pricing_strategy": "NONE",
        "pricing_free_units": 1,
        "pricing_per_unit_price": 0,
        "project_allocations": []
      },
      {
        "usage": 0.029931917,
        "usage_original": 29931917,
        "metric": "DATABASE_SIZE",
        "cost": 0,
        "unit_price_desc": "0.5 GB included",
        "available_in_plan": true,
        "unlimited": false,
        "capped": true,
        "pricing_strategy": "NONE",
        "pricing_free_units": 0.5,
        "project_allocations": [
          {
            "name": "unami-d131",
            "ref": "projxxxxxxxxxxx",
            "usage": 29931917
          }
        ]
      },
      {
        "usage": 0,
        "usage_original": 0,
        "metric": "STORAGE_IMAGES_TRANSFORMED",
        "cost": 0,
        "available_in_plan": false,
        "capped": false,
        "unlimited": false,
        "unit_price_desc": "N/A",
        "project_allocations": [],
        "pricing_strategy": "NONE"
      },
      {
        "usage": 0,
        "usage_original": 0,
        "metric": "MONTHLY_ACTIVE_SSO_USERS",
        "cost": 0,
        "available_in_plan": false,
        "capped": false,
        "unlimited": false,
        "unit_price_desc": "N/A",
        "project_allocations": [],
        "pricing_strategy": "NONE"
      }
    ]
  }
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
      enabled: enabled && IS_PLATFORM && typeof orgSlug !== 'undefined',
      staleTime: 1000 * 60 * 30, // 30 mins, underlying usage data only refreshes once an hour, so safe to cache for a while
      ...options,
    }
  )
