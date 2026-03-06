import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { actionKeys } from './keys'

type ActionLogsVariables = {
  projectRef?: string
  runId?: string
}

export async function getActionRunLogs(
  { projectRef, runId }: ActionLogsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!runId) throw new Error('runId is required')

  const { data, error } = await get(`/v1/projects/{ref}/actions/{run_id}/logs`, {
    params: { path: { ref: projectRef, run_id: runId } },
    parseAs: 'text',
    headers: { Accept: 'text/plain' },
    signal,
  })
  if (error) handleError(error)

  return data
    .split('\n')
    .flatMap((line) => line.split('\r'))
    .join('\n')
    .trim()
}

export type ActionLogsData = Awaited<ReturnType<typeof getActionRunLogs>>
export type WorkflowRunLogsError = ResponseError

export const useActionRunLogsQuery = <TData = ActionLogsData>(
  { projectRef, runId }: ActionLogsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ActionLogsData, WorkflowRunLogsError, TData> = {}
) =>
  useQuery<ActionLogsData, WorkflowRunLogsError, TData>({
    queryKey: actionKeys.logs(projectRef, runId),
    queryFn: ({ signal }) => getActionRunLogs({ projectRef, runId }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof runId !== 'undefined',
    staleTime: 0,
    ...options,
  })
