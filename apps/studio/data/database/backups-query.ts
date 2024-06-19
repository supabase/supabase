import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type BackupsVariables = {
  projectRef?: string
}

export type DatabaseBackup = components['schemas']['Backup']

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
  { enabled = true, ...options }: UseQueryOptions<BackupsData, BackupsError, TData> = {}
) =>
  useQuery<BackupsData, BackupsError, TData>(
    databaseKeys.backups(projectRef),
    ({ signal }) => getBackups({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
