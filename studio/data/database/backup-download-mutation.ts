import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import { ResponseError } from 'types'
import { Backup } from './backup-restore-mutation'

export type BackupDownloadVariables = {
  ref: string
  backup: Backup
}

export async function downloadBackup({ ref, backup }: BackupDownloadVariables) {
  const { data, error } = await post('/platform/database/{ref}/backups/download', {
    params: { path: { ref } },
    body: {
      id: backup.id, // this is the only one needed actually
      inserted_at: backup.inserted_at,
      project_id: backup.project_id,
      data: {},
      s3_bucket: 'deprecated',
      s3_path: 'deprecated',
      status: 'deprecated',
    },
  })
  if (error) throw error
  return data
}

type BackupDownloadData = Awaited<ReturnType<typeof downloadBackup>>

export const useBackupDownloadMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BackupDownloadData, ResponseError, BackupDownloadVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<BackupDownloadData, ResponseError, BackupDownloadVariables>(
    (vars) => downloadBackup(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to download backup: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
