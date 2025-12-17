import { useMutation, useQueryClient } from '@tanstack/react-query'
import { handleError, post } from 'data/fetchers'
import { toast } from 'sonner'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { agentKeys } from './keys'

export type AgentCreateVariables = {
  projectRef: string
  name?: string
}

export async function createAgent({ projectRef, name }: AgentCreateVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post(`/v1/projects/{ref}/agents`, {
    params: { path: { ref: projectRef } },
    body: { name },
  })

  if (error) handleError(error)
  return data
}

type AgentCreateData = Awaited<ReturnType<typeof createAgent>>

export const useAgentCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AgentCreateData, ResponseError, AgentCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AgentCreateData, ResponseError, AgentCreateVariables>({
    mutationFn: (vars) => createAgent(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: agentKeys.list(variables.projectRef),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create agent: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
