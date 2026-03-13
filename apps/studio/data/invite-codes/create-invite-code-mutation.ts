import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useProjectApiUrl } from 'data/config/project-endpoint-query'
import { createProjectSupabaseClient } from 'lib/project-supabase-client'
import type { ResponseError } from 'types'
import { inviteCodeKeys } from './keys'
import type { InviteCode } from './invite-codes-query'

export type CreateInviteCodeVariables = {
  projectRef: string | undefined
  clientEndpoint: string | undefined
  projectId: string
  maxSlots: number
}

export async function createInviteCode({
  projectRef,
  clientEndpoint,
  projectId,
  maxSlots,
}: CreateInviteCodeVariables): Promise<InviteCode> {
  if (!projectRef) throw new Error('Project reference is required')
  if (!clientEndpoint) throw new Error('Client endpoint is required')

  const supabaseClient = await createProjectSupabaseClient(projectRef, clientEndpoint)

  const { data, error } = await supabaseClient
    .schema('_admin')
    .from('invite_codes')
    .insert({
      project_id: projectId,
      max_slots: maxSlots,
      remaining_slots: maxSlots,
      created_by: 'admin',
    })
    .select()
    .single()

  if (error) throw error
  return data as InviteCode
}

export type CreateInviteCodeData = Awaited<ReturnType<typeof createInviteCode>>

export type CreateInviteCodeMutationVariables = {
  projectId: string
  maxSlots: number
}

type CreateInviteCodeMutationOptions = {
  projectRef: string | undefined
  onSuccess?: (data: CreateInviteCodeData) => void | Promise<void>
  onError?: (error: ResponseError) => void
}

export const useCreateInviteCodeMutation = ({
  projectRef,
  onSuccess,
  onError,
}: CreateInviteCodeMutationOptions) => {
  const queryClient = useQueryClient()
  const { hostEndpoint: clientEndpoint } = useProjectApiUrl({ projectRef })

  return useMutation<
    CreateInviteCodeData,
    ResponseError,
    CreateInviteCodeMutationVariables
  >({
    mutationFn: ({ projectId, maxSlots }) =>
      createInviteCode({ projectRef, clientEndpoint, projectId, maxSlots }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: ['projects', projectRef, 'invite-codes'],
      })
      await onSuccess?.(data)
    },
    onError: (error) => {
      if (onError === undefined) {
        toast.error(`Failed to create invite code: ${error.message}`)
      } else {
        onError(error)
      }
    },
  })
}
