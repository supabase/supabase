import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { jitDbAccessKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError } from '@/types'

type JitDbAccessInviteVariables = {
  projectRef: string
  email: string
  roles: Array<{
    role: string
    expires_at?: number // Unix timestamp in seconds per role
    allowed_networks?: {
      allowed_cidrs?: Array<{ cidr: string }>
      allowed_cidrs_v6?: Array<{ cidr: string }>
    }
    branches_only?: boolean
  }>
}

async function inviteJitDbAccess({ projectRef, email, roles }: JitDbAccessInviteVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!email) throw new Error('email is required')
  if (!roles || roles.length === 0) throw new Error('At least one role is required')

  // [SEC-859] Endpoint is not yet in the generated OpenAPI spec; cast until it is.
  const { data, error } = await (post as any)('/v1/projects/{ref}/database/jit/invite', {
    params: { path: { ref: projectRef } },
    body: { email, roles },
  })

  if (error) handleError(error)
  return data
}

type JitDbAccessInviteData = Awaited<ReturnType<typeof inviteJitDbAccess>>

export const useJitDbAccessInviteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<JitDbAccessInviteData, ResponseError, JitDbAccessInviteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<JitDbAccessInviteData, ResponseError, JitDbAccessInviteVariables>({
    mutationFn: (vars) => inviteJitDbAccess(vars),

    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: jitDbAccessKeys.members(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to invite user: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
