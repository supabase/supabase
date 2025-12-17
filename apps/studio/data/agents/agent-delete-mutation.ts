import { useMutation, useQueryClient } from '@tanstack/react-query'
import { del, handleError } from 'data/fetchers'
import { toast } from 'sonner'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { agentKeys } from './keys'

export type AgentDeleteVariables = {
  id: string
  projectRef: string
}

export async function deleteAgent({ id, projectRef }: AgentDeleteVariables) {
  if (!id) throw new Error('id is required')
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await del(`/v1/projects/{ref}/agents/{id}`, {
    params: { path: { ref: projectRef, id } },
  })

  if (error) handleError(error)
  return data
}

type AgentDeleteData = Awaited<ReturnType<typeof deleteAgent>>

export const useAgentDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AgentDeleteData, ResponseError, AgentDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AgentDeleteData, ResponseError, AgentDeleteVariables>({
    mutationFn: (vars) => deleteAgent(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: agentKeys.list(variables.projectRef),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete agent: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
