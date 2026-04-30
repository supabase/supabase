import { useQuery } from '@tanstack/react-query'

import { organizationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
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

export type { V2AuditLog as AuditLog }

export type OrganizationAuditLogsResponse = {
  result: V2AuditLog[]
  retention_period: number
}

export type OrganizationAuditLogsVariables = {
  slug?: string
  iso_timestamp_start: string
  iso_timestamp_end: string
}

export async function getOrganizationAuditLogs(
  { slug, iso_timestamp_start, iso_timestamp_end }: OrganizationAuditLogsVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get('/platform/organizations/{slug}/audit', {
    params: { path: { slug }, query: { iso_timestamp_start, iso_timestamp_end, format: 'v2' } },
    signal,
  })

  if (error) handleError(error)
  // [Joshen] API doesn't generate types for each audit log properly
  return data as unknown as OrganizationAuditLogsResponse
}

export type OrganizationAuditLogsData = Awaited<ReturnType<typeof getOrganizationAuditLogs>>
export type OrganizationAuditLogsError = ResponseError

export const useOrganizationAuditLogsQuery = <TData = OrganizationAuditLogsData>(
  vars: OrganizationAuditLogsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OrganizationAuditLogsData, OrganizationAuditLogsError, TData> = {}
) => {
  const { slug, iso_timestamp_start, iso_timestamp_end } = vars

  return useQuery<OrganizationAuditLogsData, OrganizationAuditLogsError, TData>({
    queryKey: organizationKeys.auditLogs(slug, {
      date_start: iso_timestamp_start,
      date_end: iso_timestamp_end,
    }),
    queryFn: ({ signal }) => getOrganizationAuditLogs(vars, signal),
    enabled: enabled && typeof slug !== 'undefined',
    ...options,
  })
}
