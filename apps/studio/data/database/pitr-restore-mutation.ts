import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export type PitrRestoreVariables = {
  ref: string
  recovery_time_target_unix: number
}

export async function restoreFromPitr({ ref, recovery_time_target_unix }: PitrRestoreVariables) {
  const { data, error } = await post('/platform/database/{ref}/backups/pitr', {
    params: { path: { ref } },
    body: { recovery_time_target_unix },
  })
  if (error) handleError(error)
  return data
}

type PitrRestoreData = Awaited<ReturnType<typeof restoreFromPitr>>

export const usePitrRestoreMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<PitrRestoreData, ResponseError, PitrRestoreVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<PitrRestoreData, ResponseError, PitrRestoreVariables>(
    (vars) => restoreFromPitr(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to start PITR restoration: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
