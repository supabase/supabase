import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { workflowRunKeys } from './keys'

export type WorkflowRunVariables = {
  projectRef?: string
  workflowRunId?: string
}

export async function getWorkflowRun(
  { workflowRunId }: WorkflowRunVariables,
  signal?: AbortSignal
): Promise<{ logs: string; workflowRunId: string }> {
  if (!workflowRunId) throw new Error('workflowRunId is required')

  // Use the logs endpoint which fetches workflow run status
  const { data, error } = await get('/platform/workflow-runs/{workflow_run_id}/logs', {
    params: {
      path: {
        workflow_run_id: workflowRunId,
      },
    },
    parseAs: 'text',
    signal,
  })

  if (error) {
    handleError(error)
  }

  // Return an object with the logs and we'll extract status from headers if needed
  return { logs: data as string, workflowRunId }
}

export type WorkflowRunData = { logs: string; workflowRunId: string }
export type WorkflowRunError = ResponseError

export const useWorkflowRunQuery = <TData = WorkflowRunData>(
  { projectRef, workflowRunId }: WorkflowRunVariables,
  { enabled = true, ...options }: UseQueryOptions<WorkflowRunData, WorkflowRunError, TData> = {}
) =>
  useQuery<WorkflowRunData, WorkflowRunError, TData>(
    workflowRunKeys.detail(projectRef, workflowRunId),
    ({ signal }) => getWorkflowRun({ workflowRunId }, signal),
    {
      enabled: enabled && typeof workflowRunId !== 'undefined',
      staleTime: 0,
      ...options,
    }
  )
