import useSWR from 'swr'
import { get } from 'lib/common/fetch'
import { ProjectEvents } from '@supabase/shared-types/out/events'
import { API_URL } from 'lib/constants'

export function useJwtSecretUpdateStatus(projectRef: string | string[] | undefined) {
  const url = `${API_URL}/props/project/${projectRef}/jwt-secret-update-status`
  const { data, error, mutate } = useSWR<any>(url, get, {
    refreshInterval: (data) =>
      data?.jwtSecretUpdateStatus?.event_type === ProjectEvents.ProjectJwtSecretUpdateProgress
        ? 1_000
        : 0,
  })
  const anyError = data?.error || error

  return {
    changeTrackingId: data?.jwtSecretUpdateStatus?.meta?.change_tracking_id,
    isError: !!anyError,
    isLoading: !anyError && !data,
    mutateJwtSecretUpdateStatus: mutate,
    jwtSecretUpdateMessage: data?.jwtSecretUpdateStatus?.meta?.message,
    jwtSecretUpdateStatus: data?.jwtSecretUpdateStatus?.event_type,
  }
}
