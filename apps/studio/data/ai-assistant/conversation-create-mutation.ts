import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { assistantFetch } from './fetcher'
import { aiAssistantKeys } from './keys'
import {
  mapConversation,
  unwrapConversation,
  type AssistantConversationApi,
} from './map-conversation'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type ConversationCreateVariables = {
  projectRef: string
  payload: {
    id?: string
    name?: string
    org_slug: string
    model?: string
    branched_from?: { chat_id: string; message_id: string }
  }
}

export async function createConversation({ projectRef, payload }: ConversationCreateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!payload.org_slug) throw new Error('org_slug is required')

  const data = await assistantFetch<
    AssistantConversationApi | { conversation?: AssistantConversationApi } | undefined
  >(`/v1/projects/${projectRef}/conversations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const conversation = unwrapConversation(data)
  if (!conversation) {
    return {
      id: payload.id ?? '',
      name: payload.name ?? 'New chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  return mapConversation(conversation)
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
