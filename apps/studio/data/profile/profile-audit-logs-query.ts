import { useQuery } from '@tanstack/react-query'

import { profileKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

// V2 audit log timestamps are returned in microseconds, not milliseconds.
// Divide by this constant before passing to dayjs/Date to get a valid date.
export const TIMESTAMP_MICROS_PER_MS = 1000

export type V2AuditLog = {
  organization_slug?: string
  project_ref?: string
  request_id: string
  action: {
    name: string
    method: string
    route: string
    status: number
    metadata?: Record<string, unknown>
  }
  actor: {
    token_type: string
    token_hash?: string
    user_id?: string
    email?: string
    oauth_app_id?: string
    oauth_app_name?: string
    app_id?: string
    app_name?: string
    ip?: string
  }
  timestamp: number
}

export type ProfileAuditLogsVariables = {
  iso_timestamp_start: string
  iso_timestamp_end: string
}

export async function getProfileAuditLogs(
  { iso_timestamp_start, iso_timestamp_end }: ProfileAuditLogsVariables,
  signal?: AbortSignal
) {
  const { data, error } = await get('/platform/profile/audit', {
    params: {
      query: {
        iso_timestamp_start,
        iso_timestamp_end,
        format: 'v2',
      },
    },
    signal,
  })

  if (error) handleError(error)
  return data as unknown as ProfileAuditLogsData
}

export type ProfileAuditLogsError = ResponseError
export type ProfileAuditLogsData = {
  result: V2AuditLog[]
  retention_period: number
}

export const useProfileAuditLogsQuery = <TData = ProfileAuditLogsData>(
  vars: ProfileAuditLogsVariables,
  options: UseCustomQueryOptions<ProfileAuditLogsData, ProfileAuditLogsError, TData> = {}
) => {
  const { iso_timestamp_start, iso_timestamp_end } = vars
  return useQuery<ProfileAuditLogsData, ProfileAuditLogsError, TData>({
    queryKey: profileKeys.auditLogs({
      date_start: iso_timestamp_start,
      date_end: iso_timestamp_end,
    }),
    queryFn: ({ signal }) => getProfileAuditLogs(vars, signal),
    enabled: IS_PLATFORM && options.enabled,
    ...options,
  })
}
