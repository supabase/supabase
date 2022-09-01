import useSWR from 'swr'
import { get } from 'lib/common/fetch'
import { JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { API_URL } from 'lib/constants'

export function useJwtSecretUpdateStatus(projectRef: string | string[] | undefined) {
  const url = `${API_URL}/props/project/${projectRef}/jwt-secret-update-status`
  const { data, error, mutate } = useSWR<any>(url, get, {
    refreshInterval: (data) =>
      data?.jwtSecretUpdateStatus?.meta?.status === JwtSecretUpdateStatus.Updating ? 1_000 : 0,
  })
  const anyError = data?.error || error
  const meta = data?.jwtSecretUpdateStatus?.meta
  return {
    changeTrackingId: meta?.change_tracking_id,
    error,
    isError: !!anyError,
    isLoading: !anyError && !data,
    jwtSecretUpdateError: meta?.error,
    jwtSecretUpdateProgress: meta?.progress,
    jwtSecretUpdateStatus: meta?.status,
    mutateJwtSecretUpdateStatus: mutate,
  }
}
