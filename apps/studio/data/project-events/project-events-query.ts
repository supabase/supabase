import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { projectEventsKeys } from './keys'

export type ProjectEventsVariables = {
  ref?: string
  startDate?: string
  endDate?: string
  eventTypes?: string[]
  limit?: number
}

export type ProjectSecret = components['schemas']['SecretResponse']

export async function getProjectEvents(
  { ref, startDate, endDate, eventTypes, limit }: ProjectEventsVariables,
  signal?: AbortSignal
) {
  if (!ref) throw new Error('Project ref is required')

  const { data, error } = await get(`/v1/projects/{ref}/events`, {
    params: { path: { ref }, query: { startDate, endDate, eventTypes, limit } },
    signal,
  })

  if (error) handleError(error)

  // TODO: undo type cast when API types are updated
  return data as { event_type: string; inserted_at: string }[]
}

export type ProjectEventsData = Awaited<ReturnType<typeof getProjectEvents>>
export type ProjectEventsError = ResponseError

export const useProjectEventsQuery = <TData = ProjectEventsData>(
  { ref, startDate, endDate, eventTypes, limit }: ProjectEventsVariables,
  { enabled = true, ...options }: UseQueryOptions<ProjectEventsData, ProjectEventsError, TData> = {}
) =>
  useQuery<ProjectEventsData, ProjectEventsError, TData>(
    projectEventsKeys.list(ref, startDate, endDate, eventTypes, limit),
    ({ signal }) => getProjectEvents({ ref, startDate, endDate, eventTypes, limit }, signal),
    { enabled: enabled && typeof ref !== 'undefined', ...options }
  )
