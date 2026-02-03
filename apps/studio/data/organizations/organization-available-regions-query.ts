import { useQuery } from '@tanstack/react-query'

import type { operations } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { organizationKeys } from './keys'

export type DesiredInstanceSizeForAvailableRegions =
  operations['v1-get-available-regions']['parameters']['query']['desired_instance_size']

export type OrganizationAvailableRegionsVariables = {
  slug?: string
  cloudProvider: 'AWS' | 'FLY' | 'AWS_K8S' | 'AWS_NIMBUS'
  desiredInstanceSize?: DesiredInstanceSizeForAvailableRegions
}

export async function getOrganizationAvailableRegions(
  { slug, cloudProvider, desiredInstanceSize }: OrganizationAvailableRegionsVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get(`/platform/projects/available-regions`, {
    params: {
      query: {
        cloud_provider: cloudProvider,
        organization_slug: slug,
        desired_instance_size: desiredInstanceSize,
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
  { slug, cloudProvider, desiredInstanceSize }: OrganizationAvailableRegionsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    OrganizationAvailableRegionsData,
    OrganizationAvailableRegionsError,
    TData
  > = {}
) =>
  useQuery<OrganizationAvailableRegionsData, OrganizationAvailableRegionsError, TData>({
    queryKey: organizationKeys.availableRegions(slug, cloudProvider, desiredInstanceSize),
    queryFn: ({ signal }) =>
      getOrganizationAvailableRegions({ slug, cloudProvider, desiredInstanceSize }, signal),
    enabled: enabled && typeof slug !== 'undefined',
    ...options,
  })
