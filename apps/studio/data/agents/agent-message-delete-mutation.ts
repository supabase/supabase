import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { agentKeys } from './keys'

export type AgentMessageDeleteVariables = {
  projectRef: string
  agentId: string
  messageId: string
}

export async function deleteAgentMessage(
  { projectRef, agentId, messageId }: AgentMessageDeleteVariables,
  headersInit?: HeadersInit
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!agentId) throw new Error('agentId is required')
  if (!messageId) throw new Error('messageId is required')

  const headers = new Headers(headersInit)

  // Note: This endpoint path will be added to the API types when backend is updated
  const { data, error } = await (del as any)(
    `/v1/projects/{ref}/agents/{id}/messages/{messageId}`,
    {
      params: { path: { ref: projectRef, id: agentId, messageId } },
      headers,
    }
  )

  if (error) handleError(error)
  return data
}

export type AgentMessageDeleteData = Awaited<ReturnType<typeof deleteAgentMessage>>
export type AgentMessageDeleteError = ResponseError

export const useAgentMessageDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AgentMessageDeleteData, ResponseError, AgentMessageDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AgentMessageDeleteData, ResponseError, AgentMessageDeleteVariables>({
    mutationFn: (vars) => deleteAgentMessage(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: agentKeys.messages(variables.agentId),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete message: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
