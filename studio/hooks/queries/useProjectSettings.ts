import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import useSWR from 'swr'

export function useProjectSettings(ref?: string) {
  const url = `${API_URL}/props/project/${ref}/settings`
  const { data, error } = useSWR<any>(ref ? url : null, get)
  const anyError = data?.error || error

  return {
    project: anyError ? undefined : data?.project,
    services: anyError ? undefined : data?.services,
    error: anyError,
    isLoading: !anyError && !data,
    isError: !!anyError,
  }
}
