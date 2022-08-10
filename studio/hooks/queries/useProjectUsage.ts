import useSWR from 'swr'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

export function useProjectUsage(ref?: string) {
  const url = `${API_URL}/projects/${ref}/usage`
  const { data, error } = useSWR<any>(ref ? url : null, get)
  const anyError = data?.error || error

  return {
    usage: anyError ? undefined : data,
    error: anyError,
    isLoading: !anyError && !data,
    isError: !!anyError,
  }
}
