import { JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
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

  const response = await get(`${API_URL}/props/project/${projectRef}/jwt-secret-update-status`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  const meta = response?.jwtSecretUpdateStatus?.meta

  return {
    changeTrackingId: meta?.change_tracking_id,
    jwtSecretUpdateError: meta?.error,
    jwtSecretUpdateProgress: meta?.progress,
    jwtSecretUpdateStatus: meta?.status,
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
