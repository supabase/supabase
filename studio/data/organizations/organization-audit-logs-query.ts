import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { organizationKeys } from './keys'

export type OrganizationAuditLog = {
  action: {
    metadata: {
      method: string
      status: number
    }[]
    name: string
  }
  actor: {
    id: string
    type: 'user' | string
    metadata: {
      email: string
    }[]
  }
  permission_group: {
    org_slug: string
    project_ref: string | null
  }
  target: {
    description: string
  }
  timestamp: string
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
  return response.result as OrganizationAuditLog[]
}

export type OrganizationAuditLogsData = Awaited<ReturnType<typeof getOrganizationAuditLogs>>
export type OrganizationAuditLogsError = unknown

export const useOrganizationAuditLogsQuery = <TData = OrganizationAuditLogsData>(
  vars: OrganizationAuditLogsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrganizationAuditLogsData, OrganizationAuditLogsError, TData> = {}
) => {
  const { slug } = vars
  return useQuery<OrganizationAuditLogsData, OrganizationAuditLogsError, TData>(
    organizationKeys.auditLogs(slug),
    ({ signal }) => getOrganizationAuditLogs(vars, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )
}

export const useOrganizationAuditLogsPrefetch = (vars: OrganizationAuditLogsVariables) => {
  const { slug } = vars
  const client = useQueryClient()

  return useCallback(() => {
    if (slug) {
      client.prefetchQuery(organizationKeys.auditLogs(slug), ({ signal }) =>
        getOrganizationAuditLogs(vars, signal)
      )
    }
  }, [client, slug, vars])
}
