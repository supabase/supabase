import { useMutation, useQueryClient } from '@tanstack/react-query'
import { handleError, patch } from 'data/fetchers'
import { toast } from 'sonner'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { chatSessionKeys } from './keys'

export type ChatSessionUpdateVariables = {
  id: string
  projectRef: string
  name?: string
}

export async function updateChatSession({ id, projectRef, name }: ChatSessionUpdateVariables) {
  if (!id) throw new Error('id is required')
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await patch(`/v1/projects/{ref}/chat-sessions/{id}`, {
    params: { path: { ref: projectRef, id } },
    body: { name },
  })

  if (error) handleError(error)
  return data
}

type ChatSessionUpdateData = Awaited<ReturnType<typeof updateChatSession>>

export const useChatSessionUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ChatSessionUpdateData, ResponseError, ChatSessionUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ChatSessionUpdateData, ResponseError, ChatSessionUpdateVariables>({
    mutationFn: (vars) => updateChatSession(vars),
    async onSuccess(data, variables, context) {
      const { id, projectRef } = variables
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: chatSessionKeys.list(projectRef) }),
        queryClient.invalidateQueries({ queryKey: chatSessionKeys.detail(id) }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update chat session: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
