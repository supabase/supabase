import { queryOptions, useQuery } from '@tanstack/react-query'

import { jitDbAccessKeys } from './keys'
import { get, handleError, unguarded } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'

export type JitDbAccessSelfVariables = { projectRef?: string }

async function getJitDbAccessSelf({ projectRef }: JitDbAccessSelfVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/v1/projects/{ref}/database/jit`, {
    params: { path: { ref: projectRef } },
    signal,
    grant: unguarded.migrating,
  })

  if (error) handleError(error)
  return data
}

export type JitDbAccessSelfData = Awaited<ReturnType<typeof getJitDbAccessSelf>>

export const jitDbAccessSelfQueryOptions = ({ projectRef }: JitDbAccessSelfVariables) =>
  queryOptions({
    queryKey: jitDbAccessKeys.self(projectRef),
    queryFn: ({ signal }) => getJitDbAccessSelf({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
    retry: false,
    refetchOnWindowFocus: false,
  })

export const useJitDbAccessSelfQuery = (
  { projectRef }: JitDbAccessSelfVariables,
  { enabled = true }: { enabled?: boolean } = {}
) =>
  useQuery({
    ...jitDbAccessSelfQueryOptions({ projectRef }),
    enabled: enabled && IS_PLATFORM && !!projectRef,
  })
