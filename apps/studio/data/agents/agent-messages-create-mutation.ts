import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UIMessage } from 'ai'
import { handleError, post } from 'data/fetchers'
import { toast } from 'sonner'

import type { ResponseError, UseCustomMutationOptions } from 'types'
import { agentKeys } from './keys'

export type AgentMessagesCreateVariables = {
  projectRef: string
  id: string
  messages: UIMessage[]
}

export async function createAgentMessages(
  { projectRef, id, messages }: AgentMessagesCreateVariables,
  headersInit?: HeadersInit
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('id is required')

  const headers = new Headers(headersInit)

  const { data, error } = await post(`/v1/projects/{ref}/agents/{id}/messages`, {
    params: { path: { ref: projectRef, id } },
    body: { messages: messages as any },
    headers,
  })

  if (error) handleError(error)
  return data
}

export type AgentMessagesCreateData = Awaited<ReturnType<typeof createAgentMessages>>
export type AgentMessagesCreateError = ResponseError

export const useAgentMessagesCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AgentMessagesCreateData, ResponseError, AgentMessagesCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AgentMessagesCreateData, ResponseError, AgentMessagesCreateVariables>({
    mutationFn: (vars) => createAgentMessages(vars),
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: agentKeys.messages(variables.id),
        }),
        queryClient.invalidateQueries({
          queryKey: agentKeys.detail(variables.id),
        }),
        queryClient.invalidateQueries({
          queryKey: agentKeys.list(variables.projectRef),
        }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to save agent messages: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
