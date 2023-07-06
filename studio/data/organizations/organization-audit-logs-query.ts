import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { organizationKeys } from './keys'
import { ResponseError } from 'types'
import dayjs from 'dayjs'

export type OrganizationAuditLog = {
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
  result: OrganizationAuditLog[]
  retention_period: number
}

export type OrganizationAuditLogsVariables = {
  slug?: string
  iso_timestamp_start?: string
  iso_timestamp_end?: string
  project_refs?: string // Comma-separated
}

export async function getOrganizationAuditLogs(
  { slug, iso_timestamp_start, iso_timestamp_end, project_refs }: OrganizationAuditLogsVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const response = await get(
    `${API_URL}/organizations/${slug}/audit?iso_timestamp_start=${iso_timestamp_start}&iso_timestamp_end=${iso_timestamp_end}`,
    { signal }
  )
  if (response.error) throw response.error
  return response as OrganizationAuditLogsResponse
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
  const date_start = dayjs(iso_timestamp_start).utc().format('YYYY-MM-DD')
  const date_end = dayjs(iso_timestamp_end).utc().format('YYYY-MM-DD')

  return useQuery<OrganizationAuditLogsData, OrganizationAuditLogsError, TData>(
    organizationKeys.auditLogs(slug, { date_start, date_end }),
    ({ signal }) => getOrganizationAuditLogs(vars, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )
}

export const useOrganizationAuditLogsPrefetch = (vars: OrganizationAuditLogsVariables) => {
  const { slug, iso_timestamp_start, iso_timestamp_end } = vars
  const client = useQueryClient()

  return useCallback(() => {
    if (slug) {
      const date_start = dayjs(iso_timestamp_start).utc().format('YYYY-MM-DD')
      const date_end = dayjs(iso_timestamp_end).utc().format('YYYY-MM-DD')
      client.prefetchQuery(
        organizationKeys.auditLogs(slug, { date_start, date_end }),
        ({ signal }) => getOrganizationAuditLogs(vars, signal)
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, vars])
}
