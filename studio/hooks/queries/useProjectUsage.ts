import useSWR from 'swr'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { UsageStats } from 'components/interfaces/Settings/ProjectUsageBars/ProjectUsageBars.types'

export function useProjectUsage(ref?: string) {
  const url = `${API_URL}/projects/${ref}/usage`
  const { data, error } = useSWR<any>(ref ? url : null, get)
  const anyError = data?.error || error

  return {
    usage: anyError ? undefined : (data as UsageStats),
    error: anyError,
    isLoading: !anyError && !data,
    isError: !!anyError,
  }
}
