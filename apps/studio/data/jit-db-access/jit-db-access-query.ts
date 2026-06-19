import { useQuery } from '@tanstack/react-query'

import { jitDbAccessKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type JitDbAccessVariables = { projectRef?: string }

async function getJitDbAccessConfiguration(
  { projectRef }: JitDbAccessVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/v1/projects/{ref}/jit-access`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

type JitDbAccessData = Awaited<ReturnType<typeof getJitDbAccessConfiguration>>

export const useJitDbAccessQuery = <TData = JitDbAccessData>(
  { projectRef }: JitDbAccessVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<JitDbAccessData, ResponseError, TData> = {}
) =>
  useQuery<JitDbAccessData, ResponseError, TData>({
    queryKey: jitDbAccessKeys.list(projectRef),
    queryFn: ({ signal }) => getJitDbAccessConfiguration({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
