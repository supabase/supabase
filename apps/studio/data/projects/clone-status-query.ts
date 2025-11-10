import { useQuery } from '@tanstack/react-query'
import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { projectKeys } from './keys'

export type CloneStatus = components['schemas']['ProjectClonedStatusResponse']

export async function getCloneStatus(projectRef?: string) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/database/{ref}/clone/status`, {
    params: { path: { ref: projectRef } },
  })

  if (error) handleError(error)
  return data
}

export type CloneStatusData = Awaited<ReturnType<typeof getCloneStatus>>
export type CloneStatusError = ResponseError

export const useCloneStatusQuery = <TData = CloneStatusData>(
  { projectRef }: { projectRef?: string },
  options: UseCustomQueryOptions<CloneStatusData, CloneStatusError, TData> = {}
) => {
  return useQuery<CloneStatusData, CloneStatusError, TData>({
    queryKey: projectKeys.listCloneStatus(projectRef),
    queryFn: () => getCloneStatus(projectRef),
    enabled: !!projectRef,
    ...options,
  })
}
