import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { jitDbAccessKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError } from '@/types'

type JitDbAccessInviteAcceptVariables = {
  projectRef: string
  email: string
  token: string
}

async function acceptJitDbAccessInvite({
  projectRef,
  email,
  token,
}: JitDbAccessInviteAcceptVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!email) throw new Error('email is required')
  if (!token) throw new Error('token is required')

  // [SEC-859] Endpoint is not yet in the generated OpenAPI spec; cast until it is.
  const { data, error } = await (post as any)('/v1/projects/{ref}/database/jit/invite/accept', {
    params: { path: { ref: projectRef } },
    body: { email, token },
  })

  if (error) handleError(error)
  return data
}

type JitDbAccessInviteAcceptData = Awaited<ReturnType<typeof acceptJitDbAccessInvite>>

export const useJitDbAccessInviteAcceptMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<JitDbAccessInviteAcceptData, ResponseError, JitDbAccessInviteAcceptVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<JitDbAccessInviteAcceptData, ResponseError, JitDbAccessInviteAcceptVariables>({
    mutationFn: (vars) => acceptJitDbAccessInvite(vars),

    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: jitDbAccessKeys.members(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to accept invitation: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
