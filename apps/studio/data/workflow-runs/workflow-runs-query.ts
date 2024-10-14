import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { workflowRunKeys } from './keys'

export type WorkflowRunsVariables = {
  projectRef?: string
}

export async function getWorkflowRuns({ projectRef }: WorkflowRunsVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/platform/workflow-runs`, {
    params: {
      query: {
        project_ref: projectRef,
      },
    },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type WorkflowRunsData = Awaited<ReturnType<typeof getWorkflowRuns>>
export type WorkflowRunsError = ResponseError

export const useWorkflowRunsQuery = <TData = WorkflowRunsData>(
  { projectRef }: WorkflowRunsVariables,
  { enabled = true, ...options }: UseQueryOptions<WorkflowRunsData, WorkflowRunsError, TData> = {}
) =>
  useQuery<WorkflowRunsData, WorkflowRunsError, TData>(
    workflowRunKeys.list(projectRef),
    ({ signal }) => getWorkflowRuns({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', staleTime: 0, ...options }
  )
