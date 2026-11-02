import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { jitDbAccessKeys } from './keys'
import { del, handleError } from '@/data/fetchers'
import type { GrantFor } from '@/lib/grants'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type JitDbAccessInviteDeleteVariables = {
  grant: GrantFor<'delete', '/v1/projects/{ref}/database/jit/invite/{invite_id}'>
  projectRef: string
  inviteId: string
}

async function deleteJitDbAccessInvite({
  grant,
  projectRef,
  inviteId,
}: JitDbAccessInviteDeleteVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!inviteId) throw new Error('inviteId is required')

  const { data, error } = await del('/v1/projects/{ref}/database/jit/invite/{invite_id}', {
    params: { path: { ref: projectRef, invite_id: inviteId } },
    grant,
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
  UseCustomMutationOptions<
    JitDbAccessInviteDeleteData,
    ResponseError,
    JitDbAccessInviteDeleteVariables
  >,
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
