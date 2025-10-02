import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components, operations } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { actionKeys } from './keys'

export type ActionsVariables = operations['v1-list-action-runs']['parameters']['path']
export type ActionName = components['schemas']['ActionRunResponse']['run_steps'][number]['name']
export type ActionStatus = components['schemas']['ActionRunResponse']['run_steps'][number]['status']

export async function listActionRuns(params: ActionsVariables, signal?: AbortSignal) {
  const { data, error } = await get(`/v1/projects/{ref}/actions`, {
    params: { path: params },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type ActionsData = Awaited<ReturnType<typeof listActionRuns>>
export type ActionsError = ResponseError

export const useActionsQuery = <TData = ActionsData>(
  { ref }: ActionsVariables,
  { enabled = true, ...options }: UseQueryOptions<ActionsData, ActionsError, TData> = {}
) =>
  useQuery<ActionsData, ActionsError, TData>(
    actionKeys.list(ref),
    ({ signal }) => listActionRuns({ ref }, signal),
    { enabled: enabled && Boolean(ref), staleTime: 0, ...options }
  )
