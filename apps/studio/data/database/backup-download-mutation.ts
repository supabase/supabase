import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'

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
  UseCustomMutationOptions<BackupDownloadData, ResponseError, BackupDownloadVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<BackupDownloadData, ResponseError, BackupDownloadVariables>({
    mutationFn: (vars) => downloadBackup(vars),
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
  })
}
