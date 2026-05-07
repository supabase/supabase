import { useQuery } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { actionKeys } from './keys'

type ActionRunVariables = {
  projectRef?: string
  runId?: string
}

export type ActionRun = components['schemas']['ActionRunResponse'] & {
  status?: 'SUCCESS' | 'FAILED' | 'RUNNING'
}

export async function getActionRun(
  { projectRef, runId }: ActionRunVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!runId) throw new Error('runId is required')

  const { data, error } = await get('/v1/projects/{ref}/actions/{run_id}', {
    params: { path: { ref: projectRef, run_id: runId } },
    signal,
  })

  if (error) handleError(error)

  const isRunning = data.run_steps.length === 0
  const isSuccess = data?.run_steps.every((x) => ['EXITED', 'PAUSED'].includes(x.status))
  const isFailed = data?.run_steps.some((x) => x.status === 'DEAD')

  return {
    ...data,
    status: isRunning ? 'RUNNING' : isSuccess ? 'SUCCESS' : isFailed ? 'FAILED' : 'RUNNING',
  } as ActionRun
}

export type ActionRunData = Awaited<ReturnType<typeof getActionRun>>
export type ActionRunError = ResponseError

export const useActionRunQuery = <TData = ActionRunData>(
  { projectRef, runId }: ActionRunVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<ActionRunData, ActionRunError, TData> = {}
) =>
  useQuery<ActionRunData, ActionRunError, TData>({
    queryKey: actionKeys.detail(projectRef, runId),
    queryFn: ({ signal }) => getActionRun({ projectRef, runId }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof runId !== 'undefined',
    staleTime: 0,
    ...options,
  })
