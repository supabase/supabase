import { apiKeysKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { grantedQueryOptions, type GrantedQueryCallerOptions } from '@/data/granted-query-options'
import { IS_PLATFORM } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { GrantFor } from '@/lib/grants'

export type LegacyAPIKeysStatusGrant = GrantFor<'get', '/v1/projects/{ref}/api-keys/legacy'>

interface LegacyAPIKeysStatusVariables {
  projectRef?: string
  grant?: LegacyAPIKeysStatusGrant
}

async function getLegacyAPIKeysStatus(
  { projectRef, grant }: { projectRef: string; grant: LegacyAPIKeysStatusGrant },
  signal?: AbortSignal
) {
  const { data, error } = await get(`/v1/projects/{ref}/api-keys/legacy`, {
    params: { path: { ref: projectRef } },
    signal,
    grant,
  })

  if (error) handleError(error)
  return data
}

export type LegacyAPIKeysStatusData = Awaited<ReturnType<typeof getLegacyAPIKeysStatus>>
export type LegacyAPIKeysStatusError = StudioError

export const legacyAPIKeysStatusQueryOptions = <TData = LegacyAPIKeysStatusData>(
  { projectRef, grant }: LegacyAPIKeysStatusVariables,
  options?: GrantedQueryCallerOptions<
    LegacyAPIKeysStatusData,
    LegacyAPIKeysStatusError,
    TData,
    ReturnType<typeof apiKeysKeys.status>
  >
) =>
  grantedQueryOptions(
    {
      queryKey: apiKeysKeys.status(projectRef),
      queryFn:
        projectRef && grant
          ? ({ signal }) => getLegacyAPIKeysStatus({ projectRef, grant }, signal)
          : undefined,
    },
    { ...options, enabled: IS_PLATFORM && (options?.enabled ?? true) }
  )
