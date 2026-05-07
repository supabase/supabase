import { useQuery } from '@tanstack/react-query'
import { handleError, post } from 'data/fetchers'
import { CloudProvider } from 'shared-data'
import type { ResponseError, UseCustomQueryOptions } from 'types'

import { configKeys } from './keys'

export type ProjectCreationPostgresVersionsVariables = {
  cloudProvider: CloudProvider
  dbRegion: string
  organizationSlug: string | undefined
}

export async function getPostgresCreationVersions(
  { cloudProvider, dbRegion, organizationSlug }: ProjectCreationPostgresVersionsVariables,
  signal?: AbortSignal
) {
  if (!organizationSlug) throw new Error('organizationSlug is required')

  const { data, error } = await post('/platform/organizations/{slug}/available-versions', {
    params: { path: { slug: organizationSlug } },
    body: { provider: cloudProvider, region: dbRegion },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ProjectCreationPostgresVersionData = Awaited<
  ReturnType<typeof getPostgresCreationVersions>
>
export type ProjectCreationPostgresVersionError = ResponseError

export const useProjectCreationPostgresVersionsQuery = <TData = ProjectCreationPostgresVersionData>(
  { cloudProvider, dbRegion, organizationSlug }: ProjectCreationPostgresVersionsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    ProjectCreationPostgresVersionData,
    ProjectCreationPostgresVersionError,
    TData
  > = {}
) => {
  return useQuery<ProjectCreationPostgresVersionData, ProjectCreationPostgresVersionError, TData>({
    queryKey: configKeys.projectCreationPostgresVersions(organizationSlug, cloudProvider, dbRegion),
    queryFn: ({ signal }) =>
      getPostgresCreationVersions({ organizationSlug, cloudProvider, dbRegion }, signal),
    enabled:
      enabled &&
      typeof organizationSlug !== 'undefined' &&
      organizationSlug !== '_' &&
      typeof dbRegion !== 'undefined',
    ...options,
  })
}

export const useAvailableOrioleImageVersion = (
  { cloudProvider, dbRegion, organizationSlug }: ProjectCreationPostgresVersionsVariables,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  const { data } = useProjectCreationPostgresVersionsQuery(
    {
      cloudProvider,
      dbRegion,
      organizationSlug,
    },
    {
      enabled,
      select(data) {
        return (data?.available_versions ?? []).find((x) => x.postgres_engine === '17-oriole')
      },
    }
  )

  return data
}
