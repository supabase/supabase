import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import { useIsOrioleDb } from 'hooks/misc/useSelectedProject'
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

  return {
    tierKey: 'TEAM',
    region: 'ap-southeast-1',
    pitr_enabled: false,
    walg_enabled: true,
    backups: [
      {
        isPhysicalBackup: true,
        id: 39093,
        inserted_at: '2025-02-26T16:09:16.168Z',
        status: 'COMPLETED',
        project_id: 54835,
      },
      {
        isPhysicalBackup: true,
        id: 38842,
        inserted_at: '2025-02-25T16:06:44.876Z',
        status: 'COMPLETED',
        project_id: 54835,
      },
      {
        isPhysicalBackup: true,
        id: 38658,
        inserted_at: '2025-02-24T16:09:12.362Z',
        status: 'COMPLETED',
        project_id: 54835,
      },
      {
        isPhysicalBackup: true,
        id: 38412,
        inserted_at: '2025-02-23T16:07:52.931Z',
        status: 'COMPLETED',
        project_id: 54835,
      },
      {
        isPhysicalBackup: true,
        id: 38337,
        inserted_at: '2025-02-22T16:09:17.300Z',
        status: 'COMPLETED',
        project_id: 54835,
      },
      {
        isPhysicalBackup: true,
        id: 38153,
        inserted_at: '2025-02-21T16:07:19.447Z',
        status: 'COMPLETED',
        project_id: 54835,
      },
      {
        isPhysicalBackup: true,
        id: 37982,
        inserted_at: '2025-02-20T16:05:05.987Z',
        status: 'COMPLETED',
        project_id: 54835,
      },
      {
        isPhysicalBackup: true,
        id: 37786,
        inserted_at: '2025-02-19T16:08:47.448Z',
        status: 'COMPLETED',
        project_id: 54835,
      },
      {
        isPhysicalBackup: true,
        id: 37667,
        inserted_at: '2025-02-18T16:08:34.939Z',
        status: 'COMPLETED',
        project_id: 54835,
      },
      {
        isPhysicalBackup: true,
        id: 37469,
        inserted_at: '2025-02-17T16:05:09.021Z',
        status: 'COMPLETED',
        project_id: 54835,
      },
      {
        isPhysicalBackup: true,
        id: 37306,
        inserted_at: '2025-02-16T16:08:28.376Z',
        status: 'COMPLETED',
        project_id: 54835,
      },
      {
        isPhysicalBackup: true,
        id: 37197,
        inserted_at: '2025-02-15T16:08:21.443Z',
        status: 'COMPLETED',
        project_id: 54835,
      },
      {
        isPhysicalBackup: true,
        id: 37110,
        inserted_at: '2025-02-14T16:09:12.744Z',
        status: 'COMPLETED',
        project_id: 54835,
      },
      {
        isPhysicalBackup: true,
        id: 36825,
        inserted_at: '2025-02-13T16:06:01.170Z',
        status: 'COMPLETED',
        project_id: 54835,
      },
    ],
    physicalBackupData: {},
  }

  if (error) handleError(error)
  return data
}

export type BackupsData = Awaited<ReturnType<typeof getBackups>>
export type BackupsError = ResponseError

export const useBackupsQuery = <TData = BackupsData>(
  { projectRef }: BackupsVariables,
  { enabled = true, ...options }: UseQueryOptions<BackupsData, BackupsError, TData> = {}
) => {
  // [Joshen] Check for specifically false to account for project not loaded yet
  const isOrioleDb = useIsOrioleDb()

  return useQuery<BackupsData, BackupsError, TData>(
    databaseKeys.backups(projectRef),
    ({ signal }) => getBackups({ projectRef }, signal),
    { enabled: enabled && isOrioleDb === false && typeof projectRef !== 'undefined', ...options }
  )
}
