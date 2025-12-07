import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { chatSessionKeys } from './keys'

export type ChatSessionCreateVariables = {
  projectRef: string
  name?: string
}

export async function createChatSession({ projectRef, name }: ChatSessionCreateVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post(`/v1/projects/{ref}/chat-sessions`, {
    params: { path: { ref: projectRef } },
    body: { name },
  })

  if (error) handleError(error)
  return data
}

type ChatSessionCreateData = Awaited<ReturnType<typeof createChatSession>>

export const useChatSessionCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ChatSessionCreateData, ResponseError, ChatSessionCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ChatSessionCreateData, ResponseError, ChatSessionCreateVariables>({
    mutationFn: (vars) => createChatSession(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: chatSessionKeys.list(variables.projectRef),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create chat session: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
