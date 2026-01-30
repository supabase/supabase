import { useQuery } from '@tanstack/react-query'
import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import { useIsOrioleDbInAws } from 'hooks/misc/useSelectedProject'
import type { ResponseError, UseCustomQueryOptions } from 'types'

import { databaseKeys } from './keys'

export type BackupsVariables = {
  projectRef?: string
}

export type DatabaseBackup = components['schemas']['BackupsResponse']['backups'][number]

export async function getBackups({ projectRef }: BackupsVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/database/{ref}/backups`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type BackupsData = Awaited<ReturnType<typeof getBackups>>
export type BackupsError = ResponseError

export const useBackupsQuery = <TData = BackupsData>(
  { projectRef }: BackupsVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<BackupsData, BackupsError, TData> = {}
) => {
  // [Joshen] Check for specifically false to account for project not loaded yet
  const isOrioleDbInAws = useIsOrioleDbInAws()

  return useQuery<BackupsData, BackupsError, TData>({
    queryKey: databaseKeys.backups(projectRef),
    queryFn: ({ signal }) => getBackups({ projectRef }, signal),
    enabled: enabled && !isOrioleDbInAws && typeof projectRef !== 'undefined',
    ...options,
  })
}
