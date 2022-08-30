import useSWR from 'swr'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

export function useProjectUsageStatus(ref: string) {
  const url = `${API_URL}/projects/${ref}/usage-status`
  const { data, error } = useSWR<any>(url, get)
  const anyError = data?.error || error

  return {
    config: anyError ? undefined : data,
    error: anyError,
    isLoading: !anyError && !data,
    isError: !!anyError,
  }
}
