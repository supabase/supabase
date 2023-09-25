import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { serviceStatusKeys } from './keys'

export type PostgrestServiceStatusVariables = {
  projectRef?: string
}

export async function getPostgrestServiceStatus(
  { projectRef }: PostgrestServiceStatusVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { error } = await get(`/platform/projects/{ref}/live`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) throw error
  return error === undefined
}

export type PostgrestServiceStatusData = Awaited<ReturnType<typeof getPostgrestServiceStatus>>
export type PostgrestServiceStatusError = ResponseError

export const usePostgrestServiceStatusQuery = <TData = PostgrestServiceStatusData>(
  { projectRef }: PostgrestServiceStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<PostgrestServiceStatusData, PostgrestServiceStatusError, TData> = {}
) =>
  useQuery<PostgrestServiceStatusData, PostgrestServiceStatusError, TData>(
    serviceStatusKeys.postgrest(projectRef),
    ({ signal }) => getPostgrestServiceStatus({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
