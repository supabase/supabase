import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type DownloadableBackupVariables = {
  projectRef?: string
}

export async function getDownloadableBackup(
  { projectRef }: DownloadableBackupVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/database/{ref}/backups/downloadable-backups`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type DownloadableBackupData = Awaited<ReturnType<typeof getDownloadableBackup>>
export type DownloadableBackupError = ResponseError

export const useDownloadableBackupQuery = <TData = DownloadableBackupData>(
  { projectRef }: DownloadableBackupVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DownloadableBackupData, DownloadableBackupError, TData> = {}
) =>
  useQuery<DownloadableBackupData, DownloadableBackupError, TData>(
    databaseKeys.backups(projectRef),
    ({ signal }) => getDownloadableBackup({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
