import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { usageKeys } from './keys'

export type ProjectUsageVariables = {
  projectRef?: string
}

export interface DbSize {
  usage: number | null
  limit: number
  cost: number
  current: number
  available_in_plan: boolean
}

export interface DbEgress {
  usage: number
  limit: number
  cost: number
  available_in_plan: boolean
}

export interface StorageSize {
  usage: number | null
  limit: number
  cost: number
  current: number
  available_in_plan: boolean
}

export interface StorageEgress {
  usage: number
  limit: number
  cost: number
  available_in_plan: boolean
}

export interface MonthlyActiveUsers {
  usage: number
  limit: number
  cost: number
  available_in_plan: boolean
}

export type ProjectUsageResponse = {
  db_size: DbSize
  db_egress: DbEgress
  storage_size: StorageSize
  storage_egress: StorageEgress
  monthly_active_users: MonthlyActiveUsers
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
      ...options,
    }
  )

export const useProjectUsagePrefetch = ({ projectRef }: ProjectUsageVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(usageKeys.usage(projectRef), ({ signal }) =>
        getProjectUsage({ projectRef }, signal)
      )
    }
  }, [projectRef])
}
