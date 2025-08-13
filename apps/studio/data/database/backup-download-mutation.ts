import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { components } from 'api-types'

export type BackupDownloadVariables = {
  ref: string
  backup: components['schemas']['DownloadBackupBody']
}

export async function downloadBackup({ ref, backup }: BackupDownloadVariables) {
  const { data, error } = await post('/platform/database/{ref}/backups/download', {
    params: { path: { ref } },
    body: {
      id: backup.id,
    },
  })
  if (error) handleError(error)
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
