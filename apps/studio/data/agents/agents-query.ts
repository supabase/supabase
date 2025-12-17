import { useQuery } from '@tanstack/react-query'
import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { agentKeys } from './keys'

export type AgentsVariables = {
  projectRef?: string
}

export type AgentResponse = components['schemas']['ChatSession']

export async function getAgents({ projectRef }: AgentsVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/v1/projects/{ref}/agents`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)

  if (Array.isArray(data)) return data as AgentResponse[]

  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)) {
    return (data as any).data as AgentResponse[]
  }

  throw new Error('Unexpected agents response')
}

export type AgentsData = Awaited<ReturnType<typeof getAgents>>
export type AgentsError = ResponseError

export const useAgentsQuery = <TData = AgentsData>(
  { projectRef }: AgentsVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<AgentsData, AgentsError, TData> = {}
) =>
  useQuery<AgentsData, AgentsError, TData>({
    queryKey: agentKeys.list(projectRef),
    queryFn: ({ signal }) => getAgents({ projectRef }, signal),
    enabled: IS_PLATFORM && enabled && typeof projectRef !== 'undefined',
    ...options,
  })
