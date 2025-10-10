import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { operations } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { actionKeys } from './keys'

export type ActionLogsVariables = operations['v1-get-action-run-logs']['parameters']['path']

export async function getActionRunLogs(params: ActionLogsVariables, signal?: AbortSignal) {
  const { data, error } = await get(`/v1/projects/{ref}/actions/{run_id}/logs`, {
    params: { path: params },
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
  { ref, run_id }: ActionLogsVariables,
  { enabled = true, ...options }: UseQueryOptions<ActionLogsData, WorkflowRunLogsError, TData> = {}
) =>
  useQuery<ActionLogsData, WorkflowRunLogsError, TData>(
    actionKeys.detail(ref, run_id),
    ({ signal }) => getActionRunLogs({ ref, run_id }, signal),
    { enabled: enabled && Boolean(ref) && Boolean(run_id), staleTime: 0, ...options }
  )
