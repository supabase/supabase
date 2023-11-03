import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { usageKeys } from './keys'

export type ProjectUsageVariables = {
  projectRef?: string
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

export type ProjectUsageResponse = {
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

export type ProjectUsageResponseUsageKeys = keyof Omit<ProjectUsageResponse, 'disk_volume_size_gb'>

export async function getProjectUsage({ projectRef }: ProjectUsageVariables, signal?: AbortSignal) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const response = await get(`${API_URL}/projects/${projectRef}/usage`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return response as ProjectUsageResponse
}

export type ProjectUsageData = Awaited<ReturnType<typeof getProjectUsage>>
export type ProjectUsageError = unknown

export const useProjectUsageQuery = <TData = ProjectUsageData>(
  { projectRef }: ProjectUsageVariables,
  { enabled = true, ...options }: UseQueryOptions<ProjectUsageData, ProjectUsageError, TData> = {}
) =>
  useQuery<ProjectUsageData, ProjectUsageError, TData>(
    usageKeys.usage(projectRef),
    ({ signal }) => getProjectUsage({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      select(data) {
        return Object.fromEntries(
          Object.entries(data).map(([key, value]) => {
            if (typeof value === 'object') {
              const formattedValue = {
                ...value,
                usage: Number(value.usage),
              }

              return [key, formattedValue]
            } else {
              return [key, value]
            }
          })
        )
      },
      ...options,
    }
  )
