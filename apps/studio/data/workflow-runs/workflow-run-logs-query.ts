import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { workflowRunKeys } from './keys'

export type WorkflowRunsVariables = {
  workflowRunId?: string
}

export async function getWorkflowRuns(
  { workflowRunId }: WorkflowRunsVariables,
  signal?: AbortSignal
) {
  if (!workflowRunId) throw new Error('workflowRunId is required')

  const { data, error } = await get(`/platform/workflow-runs/{workflow_run_id}/logs`, {
    params: {
      path: {
        workflow_run_id: workflowRunId,
      },
    },
    signal,
  })
  if (error) handleError(error)
  return data.split('\n').filter(Boolean)
}

export type WorkflowRunsData = Awaited<ReturnType<typeof getWorkflowRuns>>
export type WorkflowRunsError = ResponseError

export const useWorkflowRunsQuery = <TData = WorkflowRunsData>(
  { workflowRunId }: WorkflowRunsVariables,
  { enabled = true, ...options }: UseQueryOptions<WorkflowRunsData, WorkflowRunsError, TData> = {}
) =>
  useQuery<WorkflowRunsData, WorkflowRunsError, TData>(
    workflowRunKeys.list(workflowRunId),
    ({ signal }) => getWorkflowRuns({ workflowRunId }, signal),
    { enabled: enabled && typeof workflowRunId !== 'undefined', ...options }
  )
