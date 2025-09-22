import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationAvailableRegionsVariables = {
  slug?: string
  cloudProvider: 'AWS' | 'FLY' | 'AWS_K8S' | 'AWS_NIMBUS'
}

export async function getOrganizationAvailableRegions(
  { slug, cloudProvider }: OrganizationAvailableRegionsVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get(`/platform/projects/available-regions`, {
    params: {
      query: {
        cloud_provider: cloudProvider,
        organization_slug: slug,
      },
    },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type OrganizationAvailableRegionsData = Awaited<
  ReturnType<typeof getOrganizationAvailableRegions>
>
export type OrganizationAvailableRegionsError = ResponseError

export const useOrganizationAvailableRegionsQuery = <TData = OrganizationAvailableRegionsData>(
  { slug, cloudProvider }: OrganizationAvailableRegionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<
    OrganizationAvailableRegionsData,
    OrganizationAvailableRegionsError,
    TData
  > = {}
) =>
  useQuery<OrganizationAvailableRegionsData, OrganizationAvailableRegionsError, TData>(
    organizationKeys.availableRegions(slug, cloudProvider),
    ({ signal }) => getOrganizationAvailableRegions({ slug, cloudProvider }, signal),
    { enabled: enabled && typeof slug !== 'undefined', ...options }
  )
