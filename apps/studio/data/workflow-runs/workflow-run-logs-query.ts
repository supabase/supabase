import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { workflowRunKeys } from './keys'

export type WorkflowRunLogsVariables = {
  workflowRunId?: string
}

export async function getWorkflowRunLogs(
  { workflowRunId }: WorkflowRunLogsVariables,
  signal?: AbortSignal
) {
  if (!workflowRunId) throw new Error('workflowRunId is required')

  const { data, error } = await get(`/platform/workflow-runs/{workflow_run_id}/logs`, {
    params: {
      path: {
        workflow_run_id: workflowRunId,
      },
    },
    parseAs: 'text',
    headers: {
      Accept: 'text/plain',
    },
    signal,
  })
  if (error) handleError(error)
  console.log('JSON:', JSON.stringify(data))
  console.log('split on newlines', data.split('\n'))
  return data
}

export type WorkflowRunLogsData = Awaited<ReturnType<typeof getWorkflowRunLogs>>
export type WorkflowRunLogsError = ResponseError

export const useWorkflowRunLogsQuery = <TData = WorkflowRunLogsData>(
  { workflowRunId }: WorkflowRunLogsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<WorkflowRunLogsData, WorkflowRunLogsError, TData> = {}
) =>
  useQuery<WorkflowRunLogsData, WorkflowRunLogsError, TData>(
    workflowRunKeys.list(workflowRunId),
    ({ signal }) => getWorkflowRunLogs({ workflowRunId }, signal),
    { enabled: enabled && typeof workflowRunId !== 'undefined', staleTime: 0, ...options }
  )
