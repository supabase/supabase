import { queryOptions, useQuery } from '@tanstack/react-query'

import { jitDbAccessKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type JitDbAccessSelfVariables = { projectRef?: string }

async function getJitDbAccessSelf({ projectRef }: JitDbAccessSelfVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/v1/projects/{ref}/database/jit`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type JitDbAccessSelfData = Awaited<ReturnType<typeof getJitDbAccessSelf>>
export type JitDbAccessSelfError = ResponseError

export const jitDbAccessSelfQueryOptions = ({ projectRef }: JitDbAccessSelfVariables) =>
  queryOptions({
    queryKey: jitDbAccessKeys.self(projectRef),
    queryFn: ({ signal }) => getJitDbAccessSelf({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
    retry: false,
    refetchOnWindowFocus: false,
  })

export const useJitDbAccessSelfQuery = <TData = JitDbAccessSelfData>(
  { projectRef }: JitDbAccessSelfVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<JitDbAccessSelfData, JitDbAccessSelfError, TData> = {}
) =>
  useQuery<JitDbAccessSelfData, JitDbAccessSelfError, TData>({
    ...jitDbAccessSelfQueryOptions({ projectRef }),
    enabled: enabled && IS_PLATFORM && typeof projectRef !== 'undefined',
    ...options,
  })
