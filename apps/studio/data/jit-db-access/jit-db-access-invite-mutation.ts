import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { jitDbAccessKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { GrantFor } from '@/lib/grants'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type JitDbAccessInviteVariables = {
  grant: GrantFor<'post', '/v1/projects/{ref}/database/jit/invite'>
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

async function inviteJitDbAccess({ grant, projectRef, email, roles }: JitDbAccessInviteVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!email) throw new Error('email is required')
  if (!roles || roles.length === 0) throw new Error('At least one role is required')

  const { data, error } = await post('/v1/projects/{ref}/database/jit/invite', {
    params: { path: { ref: projectRef } },
    body: { email, roles },
    grant,
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
  UseCustomMutationOptions<JitDbAccessInviteData, ResponseError, JitDbAccessInviteVariables>,
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
