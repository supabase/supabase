import { useQuery } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
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
  }: UseCustomQueryOptions<DiskAttributesData, DiskAttributesError, TData> = {}
) =>
  useQuery<DiskAttributesData, DiskAttributesError, TData>({
    queryKey: configKeys.diskAttributes(projectRef),
    queryFn: ({ signal }) => getDiskAttributes({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

export const useRemainingDurationForDiskAttributeUpdate = ({
  projectRef,
  enabled = true,
}: {
  projectRef?: string
  enabled?: boolean
}) => {
  const {
    isPending: isLoading,
    isError,
    isSuccess,
    error,
  } = useDiskAttributesQuery({ projectRef }, { enabled })

  // AWS now allows up to 4 modifications in 24 hours without mandatory wait time.
  // We no longer enforce a client-side cooldown - server will return an error if limit is exceeded.
  return {
    remainingDuration: 0,
    isWithinCooldownWindow: false,
    isLoading,
    isError,
    error,
    isSuccess,
  }
}
