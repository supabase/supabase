import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError, UseCustomMutationOptions } from 'types'
import { chatSessionKeys } from './keys'
import {
  type ChatSessionMessageDeleteData,
  deleteChatSessionMessage,
  type ChatSessionMessageDeleteVariables,
} from './chat-session-message-delete'

export const useChatSessionMessageDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    ChatSessionMessageDeleteData,
    ResponseError,
    ChatSessionMessageDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    ChatSessionMessageDeleteData,
    ResponseError,
    ChatSessionMessageDeleteVariables
  >({
    mutationFn: (vars) => deleteChatSessionMessage(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: chatSessionKeys.messages(variables.chatId),
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
