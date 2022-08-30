import useSWR from 'swr'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

export function useProjectPostgrestConfig(ref?: string) {
  const url = `${API_URL}/projects/${ref}/config/postgrest`
  const { data, error, mutate } = useSWR<any>(ref ? url : null, get)
  const anyError = data?.error || error

  return {
    config: anyError ? undefined : data,
    error: anyError,
    isLoading: !anyError && !data,
    isError: !!anyError,
    mutateConfig: mutate,
  }
}
