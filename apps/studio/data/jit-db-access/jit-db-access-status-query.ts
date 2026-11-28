import { useQuery } from '@tanstack/react-query'

import { jitDbAccessKeys } from './keys'
import { get, handleError, unguarded } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomQueryOptions } from '@/types'

type JitDbAccessStatusVariables = { projectRef?: string }

// [Joshen] JFYI endpoint returns a 406 if the user doesn't have any JIT access
// So dashboard will be intentionally triggering this error since we need to call this
// endpoint to figure out if the user has been assigned JIT access (esp for non owners
// who do not have the perms to GET /database/jit/list)
async function getJitDbAccessStatus(
  { projectRef }: JitDbAccessStatusVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error, response } = await get(`/v1/projects/{ref}/database/jit`, {
    params: { path: { ref: projectRef } },
    signal,
    grant: unguarded.migrating,
  })

  // API responds 406 when the user has no JIT access mapping on the project - not an error
  if (response.status === 406) return { user_id: undefined, user_roles: [] }

  if (error) return handleError(error)

  return data
}

export type JitDbAccessStatusData = Awaited<ReturnType<typeof getJitDbAccessStatus>>
type JitDbAccessStatusError = StudioError

export const useJitDbAccessStatusQuery = <TData = JitDbAccessStatusData>(
  { projectRef }: JitDbAccessStatusVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<JitDbAccessStatusData, JitDbAccessStatusError, TData> = {}
) =>
  useQuery<JitDbAccessStatusData, JitDbAccessStatusError, TData>({
    queryKey: jitDbAccessKeys.status(projectRef),
    queryFn: ({ signal }) => getJitDbAccessStatus({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    refetchOnWindowFocus: false,
    ...options,
  })
