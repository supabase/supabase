import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import { ResponseError } from 'types'
import { components } from 'data/api'

export type BackupRestoreVariables = {
  ref: string
  backup: Backup
}

// [Joshen] Shift to backups RQ query once created
export type Backup = components['schemas']['Backup']

export async function restoreFromBackup({ ref, backup }: BackupRestoreVariables) {
  const { data, error } = await post('/platform/database/{ref}/backups/restore', {
    params: { path: { ref } },
    body: { ...backup, status: backup.status as unknown as string },
  })
  if (error) throw error
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
