import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import { jitDbAccessKeys } from './keys'
import { handleError, put } from 'data/fetchers'

export type JitDbAccessUpdateVariables = {
  projectRef: string
  requestedConfig: { state: string }
}

export type SSLEnforcementUpdateResponse = {
  appliedSuccessfully: boolean
  currentConfig: { state: string }
  error?: any
}

export async function updateJitDbAccess({
  projectRef,
  requestedConfig,
}: JitDbAccessUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await put(`/v1/projects/{ref}/jit-access`, {
    params: { path: { ref: projectRef } },
    body: requestedConfig,
  })

  if (error) handleError(error)
  return data
}

type JitDbAccessUpdateData = Awaited<ReturnType<typeof updateJitDbAccess>>

export const useJitDbAccessUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<JitDbAccessUpdateData, ResponseError, JitDbAccessUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<JitDbAccessUpdateData, ResponseError, JitDbAccessUpdateVariables>(
    (vars) => updateJitDbAccess(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(jitDbAccessKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update just-in-time (JIT) database access: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
