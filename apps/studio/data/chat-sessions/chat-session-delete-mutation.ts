import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { del, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { chatSessionKeys } from './keys'

export type ChatSessionDeleteVariables = {
  id: string
  projectRef: string
}

export async function deleteChatSession({ id, projectRef }: ChatSessionDeleteVariables) {
  if (!id) throw new Error('id is required')
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await del(`/v1/projects/{ref}/chat-sessions/{id}`, {
    params: { path: { ref: projectRef, id } },
  })

  if (error) handleError(error)
  return data
}

type ChatSessionDeleteData = Awaited<ReturnType<typeof deleteChatSession>>

export const useChatSessionDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ChatSessionDeleteData, ResponseError, ChatSessionDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ChatSessionDeleteData, ResponseError, ChatSessionDeleteVariables>({
    mutationFn: (vars) => deleteChatSession(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: chatSessionKeys.list(variables.projectRef),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete chat session: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
