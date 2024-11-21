import { JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { configKeys } from './keys'

export type JwtSecretUpdatingStatusVariables = {
  projectRef?: string
}

export type JwtSecretUpdatingStatusResponse = {
  changeTrackingId: string | undefined
  jwtSecretUpdateError: number | null | undefined
  jwtSecretUpdateProgress: number | null | undefined
  jwtSecretUpdateStatus: JwtSecretUpdateStatus | undefined
}

export async function getJwtSecretUpdatingStatus(
  { projectRef }: JwtSecretUpdatingStatusVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const { data, error } = await get('/platform/props/project/{ref}/jwt-secret-update-status', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)

  // @ts-expect-error `meta` was previously used and I'm not sure if the api has been updated
  const meta = data.jwtSecretUpdateStatus.meta ?? data.jwtSecretUpdateStatus

  return {
    changeTrackingId: meta.change_tracking_id,
    jwtSecretUpdateError: meta.error,
    jwtSecretUpdateProgress: meta.progress,
    jwtSecretUpdateStatus: meta.status,
  } as JwtSecretUpdatingStatusResponse
}

export type JwtSecretUpdatingStatusData = Awaited<ReturnType<typeof getJwtSecretUpdatingStatus>>
export type JwtSecretUpdatingStatusError = unknown

export const useJwtSecretUpdatingStatusQuery = <TData = JwtSecretUpdatingStatusData>(
  { projectRef }: JwtSecretUpdatingStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<JwtSecretUpdatingStatusData, JwtSecretUpdatingStatusError, TData> = {}
) => {
  const client = useQueryClient()

  return useQuery<JwtSecretUpdatingStatusData, JwtSecretUpdatingStatusError, TData>(
    configKeys.jwtSecretUpdatingStatus(projectRef),
    ({ signal }) => getJwtSecretUpdatingStatus({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      refetchInterval(data) {
        if (!data) {
          return false
        }

        const { jwtSecretUpdateStatus } = data as unknown as JwtSecretUpdatingStatusResponse

        const interval = jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updating ? 1000 : false

        return interval
      },
      onSuccess() {
        client.invalidateQueries(configKeys.postgrest(projectRef))
      },
      ...options,
    }
  )
}
