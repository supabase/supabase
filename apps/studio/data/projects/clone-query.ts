import { get, handleError } from 'data/fetchers'
import { projectKeys } from './keys'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { ResponseError } from 'types'

export async function getCloneBackups(projectRef?: string) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/database/{ref}/clone`, {
    params: { path: { ref: projectRef } },
  })

  if (error) handleError(error)
  return data
}

export type CloneBackupsData = Awaited<ReturnType<typeof getCloneBackups>>
export type CloneBackupsError = ResponseError

export const useCloneBackupsQuery = <TData = CloneBackupsData>(
  { projectRef }: { projectRef?: string },
  options: UseQueryOptions<CloneBackupsData, CloneBackupsError, TData> = {}
) => {
  return useQuery<CloneBackupsData, CloneBackupsError, TData>(
    projectKeys.listCloneBackups(projectRef),
    () => getCloneBackups(projectRef),
    { enabled: !!projectRef, ...options }
  )
}
