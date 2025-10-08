import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type AuditLog = {
  action: {
    metadata: {
      method?: string
      status?: number
    }[]
    name: string
  }
  actor: {
    id: string
    type: 'user' | string
    metadata: {
      email?: string
    }[]
  }
  target: {
    description: string
    metadata: {
      org_slug?: string
      project_ref?: string
    }
  }
  occurred_at: string
}

export type OrganizationAuditLogsResponse = {
  result: AuditLog[]
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
    params: { path: { slug }, query: { iso_timestamp_start, iso_timestamp_end } },
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
  }: UseQueryOptions<OrganizationAuditLogsData, OrganizationAuditLogsError, TData> = {}
) => {
  const { slug, iso_timestamp_start, iso_timestamp_end } = vars

  return useQuery<OrganizationAuditLogsData, OrganizationAuditLogsError, TData>(
    organizationKeys.auditLogs(slug, {
      date_start: iso_timestamp_start,
      date_end: iso_timestamp_end,
    }),
    ({ signal }) => getOrganizationAuditLogs(vars, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )
}
