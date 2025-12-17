import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError, UseCustomMutationOptions } from 'types'
import { chatSessionKeys } from './keys'
import {
  type ChatSessionMessagesCreateData,
  createChatSessionMessages,
  type ChatSessionMessagesCreateVariables,
} from './chat-session-messages-create'

export const useChatSessionMessagesCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    ChatSessionMessagesCreateData,
    ResponseError,
    ChatSessionMessagesCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    ChatSessionMessagesCreateData,
    ResponseError,
    ChatSessionMessagesCreateVariables
  >({
    mutationFn: (vars) => createChatSessionMessages(vars),
    async onSuccess(data, variables, context) {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: chatSessionKeys.messages(variables.id),
        }),
        queryClient.invalidateQueries({
          queryKey: chatSessionKeys.detail(variables.id),
        }),
        queryClient.invalidateQueries({
          queryKey: chatSessionKeys.list(variables.projectRef),
        }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to save chat messages: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

