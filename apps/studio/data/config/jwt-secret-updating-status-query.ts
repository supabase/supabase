import { JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { get, handleError } from 'data/fetchers'
import { ResponseError, UseCustomQueryOptions } from 'types'
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

  const { data, error } = await get('/platform/projects/{ref}/config/secrets/update-status', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)

  const meta = data.update_status

  return meta
    ? ({
        changeTrackingId: meta.change_tracking_id,
        jwtSecretUpdateError: meta.error,
        jwtSecretUpdateProgress: meta.progress,
        jwtSecretUpdateStatus: meta.status,
      } as JwtSecretUpdatingStatusResponse)
    : null
}

export type JwtSecretUpdatingStatusData = Awaited<ReturnType<typeof getJwtSecretUpdatingStatus>>
export type JwtSecretUpdatingStatusError = ResponseError

export const useJwtSecretUpdatingStatusQuery = <TData = JwtSecretUpdatingStatusData>(
  { projectRef }: JwtSecretUpdatingStatusVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<JwtSecretUpdatingStatusData, JwtSecretUpdatingStatusError, TData> = {}
) => {
  const client = useQueryClient()

  const query = useQuery({
    queryKey: configKeys.jwtSecretUpdatingStatus(projectRef),
    queryFn: ({ signal }) => getJwtSecretUpdatingStatus({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) {
        return false
      }

      const { jwtSecretUpdateStatus } = data

      const interval = jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updating ? 1000 : false

      return interval
    },

    ...options,
  })

  useEffect(() => {
    if (!query.isSuccess) return
    client.invalidateQueries({ queryKey: configKeys.postgrest(projectRef) })
  }, [query.isSuccess, projectRef, client])

  return query
}
