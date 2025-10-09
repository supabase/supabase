import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { operations } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { actionKeys } from './keys'

export type ActionRunVariables = operations['v1-get-action-run']['parameters']['path']

export async function getActionRun(params: ActionRunVariables, signal?: AbortSignal) {
  const { data, error } = await get('/v1/projects/{ref}/actions/{run_id}', {
    params: { path: params },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type ActionRunData = Awaited<ReturnType<typeof getActionRun>>
export type ActionRunError = ResponseError

export const useActionRunQuery = <TData = ActionRunData>(
  { ref, run_id }: ActionRunVariables,
  { enabled = true, ...options }: UseQueryOptions<ActionRunData, ActionRunError, TData> = {}
) =>
  useQuery<ActionRunData, ActionRunError, TData>(
    actionKeys.detail(ref, run_id),
    ({ signal }) => getActionRun({ ref, run_id }, signal),
    { enabled: enabled && Boolean(ref) && Boolean(run_id), staleTime: 0, ...options }
  )
