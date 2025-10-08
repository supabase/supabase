import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'

export type OrgProjectsVariables = {
  orgSlug?: string
}

export type OrgProjectsResponse = components['schemas']['OrganizationProjectsResponse']

export async function getOrgProjects(
  { orgSlug }: OrgProjectsVariables,
  signal?: AbortSignal
): Promise<OrgProjectsResponse> {
  if (!orgSlug) throw new Error('orgSlug is required')
  const { data, error } = await get(`/platform/organizations/{slug}/projects`, {
    params: {
      path: { slug: orgSlug },
    },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type OrgProjectsData = Awaited<ReturnType<typeof getOrgProjects>>
export type OrgProjectsError = ResponseError

export const useOrgProjectsQuery = <TData = OrgProjectsData>(
  { orgSlug }: OrgProjectsVariables,
  { enabled = true, ...options }: UseQueryOptions<OrgProjectsData, OrgProjectsError, TData> = {}
) =>
  useQuery<OrgProjectsData, OrgProjectsError, TData>(
    projectKeys.orgProjects(orgSlug),
    ({ signal }) => getOrgProjects({ orgSlug }, signal),
    {
      enabled: enabled && typeof orgSlug !== 'undefined',
      ...options,
    }
  )
