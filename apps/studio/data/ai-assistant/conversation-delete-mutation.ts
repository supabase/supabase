import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { assistantFetch } from './fetcher'
import { aiAssistantKeys } from './keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type ConversationDeleteVariables = {
  id: string
  projectRef?: string
}

export async function deleteConversation({ id }: ConversationDeleteVariables) {
  if (!id) throw new Error('id is required')

  await assistantFetch<void>(`/v1/conversations/${id}`, { method: 'DELETE' })
}

type ConversationDeleteData = Awaited<ReturnType<typeof deleteConversation>>

export const useConversationDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ConversationDeleteData, ResponseError, ConversationDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteConversation,
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
        toast.error(`Failed to delete conversation: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
