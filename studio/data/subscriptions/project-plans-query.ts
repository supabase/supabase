import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { subscriptionKeys } from './keys'

export type ProjectPlansVariables = {
  projectRef?: string
}

export type ProjectPlansResponse = {
  id: 'free' | 'pro' | 'team' | 'enterprise'
  name: string
  price: number
  is_current: boolean
  change_type: 'downgrade' | 'upgrade' | 'none'
  effective_at: string
}[]

export async function getProjectPlans({ projectRef }: ProjectPlansVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await get(`${API_URL}/projects/${projectRef}/billing/plans`, { signal })
  if (response.error) throw response.error

  return response.plans as ProjectPlansResponse
}

export type ProjectPlansData = Awaited<ReturnType<typeof getProjectPlans>>
export type ProjectPlansError = unknown

export const useProjectPlansQuery = <TData = ProjectPlansData>(
  { projectRef }: ProjectPlansVariables,
  { enabled = true, ...options }: UseQueryOptions<ProjectPlansData, ProjectPlansError, TData> = {}
) =>
  useQuery<ProjectPlansData, ProjectPlansError, TData>(
    subscriptionKeys.plans(projectRef),
    ({ signal }) => getProjectPlans({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

export const useProjectPlansPrefetch = ({ projectRef }: ProjectPlansVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(subscriptionKeys.plans(projectRef), ({ signal }) =>
        getProjectPlans({ projectRef }, signal)
      )
    }
  }, [projectRef])
}
