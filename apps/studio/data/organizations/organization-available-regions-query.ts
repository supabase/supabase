import { useQuery } from '@tanstack/react-query'
import type { operations } from 'api-types'

import { organizationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type DesiredInstanceSizeForAvailableRegions =
  operations['ProjectsController_getRegions']['parameters']['query']['desired_instance_size']

export type OrganizationAvailableRegionsVariables = {
  slug?: string
  cloudProvider: 'AWS' | 'AWS_K8S' | 'AWS_NIMBUS'
  desiredInstanceSize?: DesiredInstanceSizeForAvailableRegions
  highAvailability?: boolean
}

export async function getOrganizationAvailableRegions(
  {
    slug,
    cloudProvider,
    desiredInstanceSize,
    highAvailability,
  }: OrganizationAvailableRegionsVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get(`/platform/projects/available-regions`, {
    params: {
      query: {
        cloud_provider: cloudProvider,
        organization_slug: slug,
        desired_instance_size: desiredInstanceSize,
        high_availability: highAvailability ? 'true' : 'false',
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
  {
    slug,
    cloudProvider,
    desiredInstanceSize,
    highAvailability,
  }: OrganizationAvailableRegionsVariables,
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
    queryKey: organizationKeys.availableRegions(
      slug,
      cloudProvider,
      desiredInstanceSize,
      highAvailability
    ),
    queryFn: ({ signal }) =>
      getOrganizationAvailableRegions(
        { slug, cloudProvider, desiredInstanceSize, highAvailability },
        signal
      ),
    enabled: enabled && typeof slug !== 'undefined',
    ...options,
  })
