import { useQuery } from '@tanstack/react-query'

import { logDrainsKeys } from './keys'
import { LogDrainData } from './log-drains-query'
import { get, handleError } from '@/data/fetchers'
import { MAX_RETRY_FAILURE_COUNT } from '@/data/query-client'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type AuditLogDrainsVariables = {
  slug?: string
}

export async function getAuditLogDrains({ slug }: AuditLogDrainsVariables, signal?: AbortSignal) {
  if (!slug) {
    throw new Error('slug is required')
  }

  const { data, error } = await get('/platform/organizations/{slug}/analytics/audit-log-drains', {
    params: { path: { slug } },
    signal,
  })

  if (error) handleError(error)

  return (data ?? []) as LogDrainData[]
}

export type AuditLogDrainsData = LogDrainData[]
export type AuditLogDrainsError = ResponseError

export const useAuditLogDrainsQuery = <TData = AuditLogDrainsData>(
  { slug }: AuditLogDrainsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<AuditLogDrainsData, AuditLogDrainsError, TData> = {}
) =>
  useQuery<AuditLogDrainsData, AuditLogDrainsError, TData>({
    queryKey: logDrainsKeys.auditList(slug),
    queryFn: ({ signal }) => getAuditLogDrains({ slug }, signal),
    enabled: enabled && !!slug,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      if (error.code === 500 || error.message.includes('API error happened')) return false
      if (failureCount < MAX_RETRY_FAILURE_COUNT) {
        return true
      }
      return false
    },
    ...options,
  })
