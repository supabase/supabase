import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { assistantFetch } from './fetcher'
import { aiAssistantKeys } from './keys'
import { parseConversation } from './map-conversation'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type ConversationCreateVariables = {
  projectRef: string
  payload: {
    id?: string
    name?: string
    org_slug: string
    support_metadata?: import('@/state/ai-assistant-state').SupportChatMetadata
    model?: string
    branched_from?: { chat_id: string; message_id: string }
  }
}

export async function createConversation({ projectRef, payload }: ConversationCreateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!payload.org_slug) throw new Error('org_slug is required')

  const data = await assistantFetch<unknown>(`/v1/projects/${projectRef}/conversations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return parseConversation(data)
}

type ConversationCreateData = Awaited<ReturnType<typeof createConversation>>

export const useConversationCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ConversationCreateData, ResponseError, ConversationCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createConversation,
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: aiAssistantKeys.conversations(variables.projectRef),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create conversation: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
