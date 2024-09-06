import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { configKeys } from './keys'

export type DiskAttributesVariables = {
  projectRef?: string
}

export type DiskAttribute = components['schemas']['DiskResponse']

export async function getDiskAttributes(
  { projectRef }: DiskAttributesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/projects/{ref}/disk`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type DiskAttributesData = Awaited<ReturnType<typeof getDiskAttributes>>
export type DiskAttributesError = ResponseError

export const useDiskAttributesQuery = <TData = DiskAttributesData>(
  { projectRef }: DiskAttributesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DiskAttributesData, DiskAttributesError, TData> = {}
) =>
  useQuery<DiskAttributesData, DiskAttributesError, TData>(
    configKeys.diskAttributes(projectRef),
    ({ signal }) => getDiskAttributes({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
