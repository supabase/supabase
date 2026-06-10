import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { exPgMetaKeys } from './keys'
import { handleError, patch } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type ExPgMetaOptInUpdateVariables = {
  projectRef: string
  enabled: boolean
}

export async function updateExPgMetaOptIn({ projectRef, enabled }: ExPgMetaOptInUpdateVariables) {
  const { data, error } = await patch('/platform/projects/{ref}/settings/ex-pg-meta', {
    params: { path: { ref: projectRef } },
    body: { enabled },
  })

  if (error) handleError(error)
  return data
}

type ExPgMetaOptInUpdateData = Awaited<ReturnType<typeof updateExPgMetaOptIn>>

export const useExPgMetaOptInUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    ExPgMetaOptInUpdateData,
    ResponseError,
    ExPgMetaOptInUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ExPgMetaOptInUpdateData, ResponseError, ExPgMetaOptInUpdateVariables>({
    mutationFn: (vars) => updateExPgMetaOptIn(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      queryClient.setQueryData(exPgMetaKeys.optIn(projectRef), data)
      await onSuccess?.(data, variables, context)
    },
    onError(error, variables, context) {
      toast.error(`Failed to update Next Postgres Meta setting: ${error.message}`)
      onError?.(error, variables, context)
    },
    ...options,
  })
}
