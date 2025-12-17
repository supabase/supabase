import { useMutation, useQueryClient } from '@tanstack/react-query'
import { handleError, patch } from 'data/fetchers'
import { toast } from 'sonner'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { agentKeys } from './keys'

export type AgentUpdateVariables = {
  id: string
  projectRef: string
  name?: string
}

export async function updateAgent(
  { id, projectRef, name }: AgentUpdateVariables,
  headersInit?: HeadersInit
) {
  if (!id) throw new Error('id is required')
  if (!projectRef) throw new Error('projectRef is required')

  const headers = headersInit ? new Headers(headersInit) : undefined

  const { data, error } = await patch(`/v1/projects/{ref}/agents/{id}`, {
    params: { path: { ref: projectRef, id } },
    body: { name },
    ...(headers && { headers }),
  })

  if (error) handleError(error)
  return data
}

type AgentUpdateData = Awaited<ReturnType<typeof updateAgent>>

export const useAgentUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AgentUpdateData, ResponseError, AgentUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AgentUpdateData, ResponseError, AgentUpdateVariables>({
    mutationFn: (vars) => updateAgent(vars),
    async onSuccess(data, variables, context) {
      const { id, projectRef } = variables
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: agentKeys.list(projectRef) }),
        queryClient.invalidateQueries({ queryKey: agentKeys.detail(id) }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update agent: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
