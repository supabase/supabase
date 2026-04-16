import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { jitDbAccessKeys } from './keys'
import { del, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type JitDbAccessRevokeVariables = {
  projectRef: string
  userId: string
}

async function revokeJitDbAccess({ projectRef, userId }: JitDbAccessRevokeVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!userId) throw new Error('userId is required')

  const { data, error } = await del('/v1/projects/{ref}/database/jit/{user_id}', {
    params: { path: { ref: projectRef, user_id: userId } },
  })

  if (error) handleError(error)
  return data
}

type JitDbAccessRevokeData = Awaited<ReturnType<typeof revokeJitDbAccess>>

export const useJitDbAccessRevokeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<JitDbAccessRevokeData, ResponseError, JitDbAccessRevokeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<JitDbAccessRevokeData, ResponseError, JitDbAccessRevokeVariables>({
    mutationFn: (vars) => revokeJitDbAccess(vars),

    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: jitDbAccessKeys.members(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to revoke JIT database access: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
