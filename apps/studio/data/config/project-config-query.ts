import { queryOptions } from '@tanstack/react-query'

import { configKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type ProjectConfigV2Variables = {
  projectRef?: string
}

export async function getProjectConfig(
  { projectRef }: ProjectConfigV2Variables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  // [Alpha] GET /v2/projects/{ref}/config — the project's effective service config
  // (database, pooler, auth, api, realtime, storage).
  const { data, error } = await get('/v2/projects/{ref}/config', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return (data || { data: undefined }).data
}

export type ProjectConfigV2Data = Awaited<ReturnType<typeof getProjectConfig>>
export type ProjectConfigV2Error = ResponseError

export const projectConfigV2QueryOptions = (
  { projectRef }: ProjectConfigV2Variables,
  { enabled = true }: { enabled?: boolean } = { enabled: true }
) => {
  return queryOptions({
    queryKey: configKeys.projectConfig(projectRef),
    queryFn: ({ signal }) => getProjectConfig({ projectRef }, signal),
    enabled: enabled && IS_PLATFORM && typeof projectRef !== 'undefined',
  })
}
