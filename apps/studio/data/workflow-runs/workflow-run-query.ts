import { useQuery } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { workflowRunKeys } from './keys'

export type WorkflowRunVariables = {
  projectRef?: string
  workflowRunId?: string
}

export type WorkflowRun = components['schemas']['ActionRunResponse'] & {
  status: 'SUCCESS' | 'FAILED' | 'RUNNING'
}

export async function getWorkflowRun(
  { projectRef, workflowRunId }: WorkflowRunVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!workflowRunId) throw new Error('workflowRunId is required')

  // Use the logs endpoint which fetches workflow run status
  const { data, error } = await get('/v1/projects/{ref}/actions/{run_id}', {
    params: {
      path: {
        ref: projectRef,
        run_id: workflowRunId,
      },
    },
    signal,
  })

  const isSuccess = data?.run_steps.every((x) => ['EXITED', 'PAUSED'].includes(x.status))
  const isFailed = data?.run_steps.some((x) => x.status === 'DEAD')

  if (error) handleError(error)
  return { ...data, status: isSuccess ? 'SUCCESS' : isFailed ? 'FAILED' : 'RUNNING' } as WorkflowRun
}

export type WorkflowRunData = Awaited<ReturnType<typeof getWorkflowRun>>
export type WorkflowRunError = ResponseError

export const useWorkflowRunQuery = <TData = WorkflowRunData>(
  { projectRef, workflowRunId }: WorkflowRunVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<WorkflowRunData, WorkflowRunError, TData> = {}
) =>
  useQuery<WorkflowRunData, WorkflowRunError, TData>({
    queryKey: workflowRunKeys.status(projectRef, workflowRunId),
    queryFn: ({ signal }) => getWorkflowRun({ projectRef, workflowRunId }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof workflowRunId !== 'undefined',
    staleTime: 0,
    ...options,
  })
