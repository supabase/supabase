import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import { jitDbAccessKeys } from './keys'
import { handleError, put } from 'data/fetchers'

export type JitDbAccessGrantVariables = {
  projectRef: string
  userId: string
  roles: Array<{ role: string; expires_at?: number }> // Unix timestamp in seconds per role
}

export type JitDbAccessGrantResponse = {
  success: boolean
  error?: any
}

export async function grantJitDbAccess({ projectRef, userId, roles }: JitDbAccessGrantVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!userId) throw new Error('userId is required')
  if (!roles || roles.length === 0) throw new Error('At least one role is required')

  const { data, error } = await put(`/v1/projects/{ref}/database/jit`, {
    params: { path: { ref: projectRef } },
    body: {
      user_id: userId,
      roles,
    },
  })

  if (error) handleError(error)
  return data
}

type JitDbAccessGrantData = Awaited<ReturnType<typeof grantJitDbAccess>>

export const useJitDbAccessGrantMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<JitDbAccessGrantData, ResponseError, JitDbAccessGrantVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<JitDbAccessGrantData, ResponseError, JitDbAccessGrantVariables>({
    mutationFn: (vars) => grantJitDbAccess(vars),

    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: jitDbAccessKeys.members(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to grant JIT database access: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
