import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export type EnablePhysicalBackupsVariables = {
  ref: string
}

export async function enablePhysicalBackups({ ref }: EnablePhysicalBackupsVariables) {
  const { data, error } = await post('/platform/database/{ref}/backups/enable-physical-backups', {
    params: { path: { ref } },
  })
  if (error) handleError(error)
  return data
}

type BackupRestoreData = Awaited<ReturnType<typeof enablePhysicalBackups>>

export const useEnablePhysicalBackupsMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BackupRestoreData, ResponseError, EnablePhysicalBackupsVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<BackupRestoreData, ResponseError, EnablePhysicalBackupsVariables>(
    (vars) => enablePhysicalBackups(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to enable physical backups: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
