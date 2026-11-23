import { queryOptions } from '@tanstack/react-query'

import { logSettingsKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'

export type LogSettingsVariables = { projectRef?: string }
export type LogSettingsError = StudioError

async function getLogSettings({ projectRef }: LogSettingsVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/projects/{ref}/analytics/log-settings', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type LogSettingsData = Awaited<ReturnType<typeof getLogSettings>>

export const logSettingsQueryOptions = ({ projectRef }: LogSettingsVariables) =>
  queryOptions({
    queryKey: logSettingsKeys.detail(projectRef),
    queryFn: ({ signal }) => getLogSettings({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
  })
