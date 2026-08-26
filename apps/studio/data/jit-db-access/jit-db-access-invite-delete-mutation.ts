import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { jitDbAccessKeys } from './keys'
import { del, handleError } from '@/data/fetchers'
import type { ResponseError } from '@/types'

type JitDbAccessInviteDeleteVariables = {
  projectRef: string
  inviteId: string
}

async function deleteJitDbAccessInvite({ projectRef, inviteId }: JitDbAccessInviteDeleteVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!inviteId) throw new Error('inviteId is required')

  // [SEC-859] Endpoint is not yet in the generated OpenAPI spec; cast until it is.
  const { data, error } = await (del as any)('/v1/projects/{ref}/database/jit/invite/{invite_id}', {
    params: { path: { ref: projectRef, invite_id: inviteId } },
  })

  if (error) handleError(error)
  return data
}

type JitDbAccessInviteDeleteData = Awaited<ReturnType<typeof deleteJitDbAccessInvite>>

export const useJitDbAccessInviteDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<JitDbAccessInviteDeleteData, ResponseError, JitDbAccessInviteDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<JitDbAccessInviteDeleteData, ResponseError, JitDbAccessInviteDeleteVariables>({
    mutationFn: (vars) => deleteJitDbAccessInvite(vars),

    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: jitDbAccessKeys.members(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete invitation: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
