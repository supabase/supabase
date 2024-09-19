import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export type BackupRestoreVariables = {
  ref: string
  backup: Backup
}

// [Joshen] Shift to backups RQ query once created
export type Backup = components['schemas']['Backup']

export async function restoreFromBackup({ ref, backup }: BackupRestoreVariables) {
  if (backup.isPhysicalBackup) {
    const { data, error } = await post('/platform/database/{ref}/backups/restore-physical', {
      params: { path: { ref } },
      body: { id: backup.id, recovery_time_target: backup.inserted_at },
    })
    if (error) throw error
    return data
  }

  const { data, error } = await post('/platform/database/{ref}/backups/restore', {
    params: { path: { ref } },
    body: { id: backup.id },
  })
  if (error) handleError(error)
  return data
}

type BackupRestoreData = Awaited<ReturnType<typeof restoreFromBackup>>

export const useBackupRestoreMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BackupRestoreData, ResponseError, BackupRestoreVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<BackupRestoreData, ResponseError, BackupRestoreVariables>(
    (vars) => restoreFromBackup(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to restore from backup: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
