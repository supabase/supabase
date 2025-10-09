import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { analyticsKeys } from './keys'

export enum EgressType {
  REST = 'egress_rest',
  AUTH = 'egress_auth',
  STORAGE = 'egress_storage',
  REALTIME = 'egress_realtime',
  FUNCTIONS = 'egress_functions',
  SUPAVISOR = 'egress_supavisor',
  LOGDRAIN = 'egress_logdrain',
}

// [Joshen] Get this from common package instead of API and dashboard having one copy each
export enum PricingMetric {
  EGRESS = 'EGRESS',
  CACHED_EGRESS = 'CACHED_EGRESS',
  DATABASE_SIZE = 'DATABASE_SIZE',
  STORAGE_SIZE = 'STORAGE_SIZE',
  DISK_SIZE_GB_HOURS_GP3 = 'DISK_SIZE_GB_HOURS_GP3',
  DISK_SIZE_GB_HOURS_IO2 = 'DISK_SIZE_GB_HOURS_IO2',
  MONTHLY_ACTIVE_USERS = 'MONTHLY_ACTIVE_USERS',
  MONTHLY_ACTIVE_SSO_USERS = 'MONTHLY_ACTIVE_SSO_USERS',
  MONTHLY_ACTIVE_THIRD_PARTY_USERS = 'MONTHLY_ACTIVE_THIRD_PARTY_USERS',
  FUNCTION_INVOCATIONS = 'FUNCTION_INVOCATIONS',
  STORAGE_IMAGES_TRANSFORMED = 'STORAGE_IMAGES_TRANSFORMED',
  REALTIME_MESSAGE_COUNT = 'REALTIME_MESSAGE_COUNT',
  REALTIME_PEAK_CONNECTIONS = 'REALTIME_PEAK_CONNECTIONS',
  CUSTOM_DOMAIN = 'CUSTOM_DOMAIN',
  IPV4 = 'IPV4',
  PITR_7 = 'PITR_7',
  PITR_14 = 'PITR_14',
  PITR_28 = 'PITR_28',
  DISK_IOPS_GP3 = 'DISK_IOPS_GP3',
  DISK_IOPS_IO2 = 'DISK_IOPS_IO2',
  DISK_THROUGHPUT_GP3 = 'DISK_THROUGHPUT_GP3',
  LOG_DRAIN = 'LOG_DRAIN',
  LOG_DRAIN_EVENTS = 'LOG_DRAIN_EVENTS',
  AUTH_MFA_PHONE = 'AUTH_MFA_PHONE',
  AUTH_MFA_WEB_AUTHN = 'AUTH_MFA_WEB_AUTHN',
}

export enum ComputeUsageMetric {
  COMPUTE_HOURS_BRANCH = 'COMPUTE_HOURS_BRANCH',
  COMPUTE_HOURS_XS = 'COMPUTE_HOURS_XS',
  COMPUTE_HOURS_SM = 'COMPUTE_HOURS_SM',
  COMPUTE_HOURS_MD = 'COMPUTE_HOURS_MD',
  COMPUTE_HOURS_L = 'COMPUTE_HOURS_L',
  COMPUTE_HOURS_XL = 'COMPUTE_HOURS_XL',
  COMPUTE_HOURS_2XL = 'COMPUTE_HOURS_2XL',
  COMPUTE_HOURS_4XL = 'COMPUTE_HOURS_4XL',
  COMPUTE_HOURS_8XL = 'COMPUTE_HOURS_8XL',
  COMPUTE_HOURS_12XL = 'COMPUTE_HOURS_12XL',
  COMPUTE_HOURS_16XL = 'COMPUTE_HOURS_16XL',
  COMPUTE_HOURS_24XL = 'COMPUTE_HOURS_24XL',
  COMPUTE_HOURS_24XL_OPTIMIZED_CPU = 'COMPUTE_HOURS_24XL_OPTIMIZED_CPU',
  COMPUTE_HOURS_24XL_OPTIMIZED_MEMORY = 'COMPUTE_HOURS_24XL_OPTIMIZED_MEMORY',
  COMPUTE_HOURS_24XL_HIGH_MEMORY = 'COMPUTE_HOURS_24XL_HIGH_MEMORY',
  COMPUTE_HOURS_48XL = 'COMPUTE_HOURS_48XL',
  COMPUTE_HOURS_48XL_OPTIMIZED_CPU = 'COMPUTE_HOURS_48XL_OPTIMIZED_CPU',
  COMPUTE_HOURS_48XL_OPTIMIZED_MEMORY = 'COMPUTE_HOURS_48XL_OPTIMIZED_MEMORY',
  COMPUTE_HOURS_48XL_HIGH_MEMORY = 'COMPUTE_HOURS_48XL_HIGH_MEMORY',
}

export const computeUsageMetricLabel = (computeUsageMetric: ComputeUsageMetric) => {
  switch (computeUsageMetric) {
    case 'COMPUTE_HOURS_BRANCH':
      return 'Branching'
    case 'COMPUTE_HOURS_XS':
      return 'Micro'
    case 'COMPUTE_HOURS_SM':
      return 'Small'
    case 'COMPUTE_HOURS_MD':
      return 'Medium'
    case 'COMPUTE_HOURS_L':
      return 'Large'
    case 'COMPUTE_HOURS_XL':
      return 'XL'
    case 'COMPUTE_HOURS_2XL':
      return '2XL'
    case 'COMPUTE_HOURS_4XL':
      return '4XL'
    case 'COMPUTE_HOURS_8XL':
      return '8XL'
    case 'COMPUTE_HOURS_12XL':
      return '12XL'
    case 'COMPUTE_HOURS_16XL':
      return '16XL'
    case 'COMPUTE_HOURS_24XL':
      return '24XL'
    case 'COMPUTE_HOURS_24XL_OPTIMIZED_CPU':
      return '24XL - Optimized CPU'
    case 'COMPUTE_HOURS_24XL_OPTIMIZED_MEMORY':
      return '24XL - Optimized Memory'
    case 'COMPUTE_HOURS_24XL_HIGH_MEMORY':
      return '24XL - High Memory'
    case 'COMPUTE_HOURS_48XL':
      return '48XL'
    case 'COMPUTE_HOURS_48XL_OPTIMIZED_CPU':
      return '48XL - Optimized CPU'
    case 'COMPUTE_HOURS_48XL_OPTIMIZED_MEMORY':
      return '48XL - Optimized Memory'
    case 'COMPUTE_HOURS_48XL_HIGH_MEMORY':
      return '48XL - High Memory'
  }
}

export type OrgDailyStatsVariables = {
  // API parameters
  orgSlug?: string
  startDate?: string
  endDate?: string
  projectRef?: string
}

export type OrgDailyUsageResponse = components['schemas']['OrgDailyUsageResponse']

export async function getOrgDailyStats(
  { orgSlug, startDate, endDate, projectRef }: OrgDailyStatsVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('Org slug is required')
  if (!startDate) throw new Error('Start date is required')
  if (!endDate) throw new Error('Start date is required')

  const { data, error } = await get('/platform/organizations/{slug}/usage/daily', {
    params: {
      path: { slug: orgSlug },
      query: {
        start: startDate,
        end: endDate,
        projectRef,
      },
    },
    signal,
  })

  if (error) handleError(error)

  return data
}

export type OrgDailyStatsData = Awaited<ReturnType<typeof getOrgDailyStats>>
export type OrgDailyStatsError = ResponseError

export const useOrgDailyStatsQuery = <TData = OrgDailyStatsData>(
  { orgSlug, startDate, endDate, projectRef }: OrgDailyStatsVariables,
  { enabled = true, ...options }: UseQueryOptions<OrgDailyStatsData, OrgDailyStatsError, TData> = {}
) =>
  useQuery<OrgDailyStatsData, OrgDailyStatsError, TData>(
    analyticsKeys.orgDailyStats(orgSlug, { startDate, endDate, projectRef }),
    ({ signal }) => getOrgDailyStats({ orgSlug, startDate, endDate, projectRef }, signal),
    {
      enabled:
        enabled &&
        typeof orgSlug !== 'undefined' &&
        typeof startDate !== 'undefined' &&
        typeof endDate !== 'undefined',
      staleTime: 1000 * 60 * 60, // default good for an hour for now
      ...options,
    }
  )
