import { useQuery } from '@tanstack/react-query'
import { components } from 'api-types'

import { organizationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

// Audit log timestamps are returned in microseconds, not milliseconds.
// Divide by this constant before passing to dayjs/Date to get a valid date.
export const TIMESTAMP_MICROS_PER_MS = 1000

export type AuditLog = components['schemas']['AuditLogsResponse_Output']['result'][number]

type OrganizationAuditLogsVariables = {
  slug?: string
  iso_timestamp_start: string
  iso_timestamp_end: string
}

async function getOrganizationAuditLogs(
  { slug, iso_timestamp_start, iso_timestamp_end }: OrganizationAuditLogsVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get('/platform/organizations/{slug}/audit', {
    params: { path: { slug }, query: { iso_timestamp_start, iso_timestamp_end } },
    signal,
  })

  if (error) handleError(error)
  return data
}

type OrganizationAuditLogsData = Awaited<ReturnType<typeof getOrganizationAuditLogs>>
type OrganizationAuditLogsError = ResponseError

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
