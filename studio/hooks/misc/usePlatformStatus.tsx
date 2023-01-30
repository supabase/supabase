import useSWR from 'swr'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

export const usePlatformStatus = () => {
  const { data, error, mutate } = useSWR<{ is_healthy: boolean }>(`${API_URL}/status`, get)

  const anyError = (data as any)?.error || error !== undefined
  const refresh = () => mutate()

  return {
    isHealthy: anyError ? undefined : data?.is_healthy,
    isLoading: !anyError && !data,
    isError: !!anyError,
    refresh,
  }
}
