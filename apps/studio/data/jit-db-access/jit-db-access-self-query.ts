import { useQuery } from '@tanstack/react-query'

import { jitDbAccessKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type JitDbAccessSelfVariables = { projectRef?: string }

async function getJitDbAccessSelf({ projectRef }: JitDbAccessSelfVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/v1/projects/{ref}/database/jit`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) {
    handleError(error)
  }

  return data
}

export type JitDbAccessSelfData = Awaited<ReturnType<typeof getJitDbAccessSelf>>
type JitDbAccessSelfError = ResponseError

export const useJitDbAccessSelfQuery = <TData = JitDbAccessSelfData>(
  { projectRef }: JitDbAccessSelfVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<JitDbAccessSelfData, JitDbAccessSelfError, TData> = {}
) =>
  useQuery<JitDbAccessSelfData, JitDbAccessSelfError, TData>({
    queryKey: jitDbAccessKeys.self(projectRef),
    queryFn: ({ signal }) => getJitDbAccessSelf({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  })
