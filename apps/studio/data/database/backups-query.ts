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

  return {
    region: 'ap-southeast-1',
    pitr_enabled: false,
    walg_enabled: true,
    backups: [
      {
        isPhysicalBackup: true,
        id: 141661,
        inserted_at: '2026-01-24T15:55:44.027Z',
        status: 'COMPLETED',
        project_id: 139767,
      },
      {
        isPhysicalBackup: true,
        id: 137324,
        inserted_at: '2026-01-17T15:56:56.988Z',
        status: 'COMPLETED',
        project_id: 139767,
      },
    ],
    physicalBackupData: {},
  }
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
