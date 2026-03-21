import { useMutation, useQueryClient } from '@tanstack/react-query'
import { literal } from '@supabase/pg-meta/src/pg-format'
import { toast } from 'sonner'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { ResponseError } from 'types'
import { executeSql } from '../sql/execute-sql-query'
import { inviteCodeKeys } from './keys'
import type { InviteCode } from './invite-codes-query'

export type CreateInviteCodeVariables = {
  projectRef: string | undefined
  connectionString: string | null | undefined
  projectId: string
  maxSlots: number
}

export async function createInviteCode({
  projectRef,
  connectionString,
  projectId,
  maxSlots,
}: CreateInviteCodeVariables): Promise<InviteCode> {
  if (!projectRef) throw new Error('Project reference is required')
  if (!connectionString) throw new Error('Connection string is required')

  const normalizedMaxSlots = Math.trunc(maxSlots)
  if (normalizedMaxSlots < 1) throw new Error('Max slots must be at least 1')

  const { result } = await executeSql<InviteCode[]>({
    projectRef,
    connectionString,
    sql: /* SQL */ `
      insert into _admin.invite_codes (project_id, max_slots, remaining_slots, created_by)
      values (
        ${literal(projectId)},
        ${normalizedMaxSlots},
        ${normalizedMaxSlots},
        ${literal('admin')}
      )
      returning id, project_id, code, max_slots, remaining_slots, created_by, created_at;
    `,
  })

  const [insertedInviteCode] = result
  if (!insertedInviteCode) throw new Error('Failed to create invite code')

  return insertedInviteCode
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
  const { data: project } = useSelectedProjectQuery()
  const connectionString = project?.connectionString

  return useMutation<
    CreateInviteCodeData,
    ResponseError,
    CreateInviteCodeMutationVariables
  >({
    mutationFn: ({ projectId, maxSlots }) =>
      createInviteCode({ projectRef, connectionString, projectId, maxSlots }),
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
