import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { assistantFetch } from './fetcher'
import { aiAssistantKeys } from './keys'
import { mapConversation, type AssistantConversationApi } from './map-conversation'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type ConversationUpdateVariables = {
  id: string
  projectRef?: string
  payload: {
    name?: string
    model?: string
  }
}

export async function updateConversation({ id, payload }: ConversationUpdateVariables) {
  if (!id) throw new Error('id is required')

  const data = await assistantFetch<AssistantConversationApi>(`/v1/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return mapConversation(data)
}

type ConversationUpdateData = Awaited<ReturnType<typeof updateConversation>>

export const useConversationUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ConversationUpdateData, ResponseError, ConversationUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateConversation,
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: aiAssistantKeys.conversation(variables.id) }),
        variables.projectRef
          ? queryClient.invalidateQueries({
              queryKey: aiAssistantKeys.conversations(variables.projectRef),
            })
          : Promise.resolve(),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update conversation: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
