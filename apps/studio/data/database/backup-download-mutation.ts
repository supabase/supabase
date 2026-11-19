import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post, unguarded } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type BackupDownloadVariables = {
  ref: string
  backupId: number
}

export async function downloadBackup({ ref, backupId }: BackupDownloadVariables) {
  const { data, error } = await post('/platform/database/{ref}/backups/download', {
    params: { path: { ref } },
    body: { id: backupId },
    grant: unguarded.migrating,
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
  UseCustomMutationOptions<BackupDownloadData, StudioError, BackupDownloadVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<BackupDownloadData, StudioError, BackupDownloadVariables>({
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
