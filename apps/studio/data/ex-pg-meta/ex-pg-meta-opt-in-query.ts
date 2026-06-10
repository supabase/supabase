import { useQuery } from '@tanstack/react-query'

import { exPgMetaKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type ExPgMetaOptInVariables = { projectRef?: string }

export type ExPgMetaOptInResponse = {
  enabled: boolean
}

export async function getExPgMetaOptIn(
  { projectRef }: ExPgMetaOptInVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/projects/{ref}/settings/ex-pg-meta', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

type ExPgMetaOptInData = Awaited<ReturnType<typeof getExPgMetaOptIn>>
type ExPgMetaOptInError = ResponseError

export const useExPgMetaOptInQuery = <TData = ExPgMetaOptInData>(
  { projectRef }: ExPgMetaOptInVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ExPgMetaOptInData, ExPgMetaOptInError, TData> = {}
) => {
  return useQuery<ExPgMetaOptInData, ExPgMetaOptInError, TData>({
    queryKey: exPgMetaKeys.optIn(projectRef),
    queryFn: ({ signal }) => getExPgMetaOptIn({ projectRef }, signal),
    enabled: enabled && IS_PLATFORM && !!projectRef,
    ...options,
  })
}
