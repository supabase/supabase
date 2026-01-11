import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { workflowRunKeys } from './keys'

export type WorkflowRunLogsVariables = {
  projectRef?: string
  workflowRunId?: string
}

export async function getWorkflowRunLogs(
  { projectRef, workflowRunId }: WorkflowRunLogsVariables,
  signal?: AbortSignal
): Promise<{ logs: string; workflowRunId: string }> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!workflowRunId) throw new Error('workflowRunId is required')

  // Use the logs endpoint which fetches workflow run status
  const { data, error } = await get('/v1/projects/{ref}/actions/{run_id}/logs', {
    params: {
      path: {
        ref: projectRef,
        run_id: workflowRunId,
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

export type WorkflowRunLogsData = { logs: string; workflowRunId: string }
export type WorkflowRunLogsError = ResponseError

export const useWorkflowRunLogsQuery = <TData = WorkflowRunLogsData>(
  { projectRef, workflowRunId }: WorkflowRunLogsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<WorkflowRunLogsData, WorkflowRunLogsError, TData> = {}
) =>
  useQuery<WorkflowRunLogsData, WorkflowRunLogsError, TData>({
    queryKey: workflowRunKeys.detail(projectRef, workflowRunId),
    queryFn: ({ signal }) => getWorkflowRunLogs({ projectRef, workflowRunId }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof workflowRunId !== 'undefined',
    staleTime: 0,
    ...options,
  })
