import { get } from 'lib/common/fetch'
import { API_URL, DEFAULT_PROJECT_API_SERVICE_ID } from 'lib/constants'
import useSWR from 'swr'

export function useProjectSettings(ref?: string) {
  const url = `${API_URL}/props/project/${ref}/settings`
  const { data, error, mutate } = useSWR<any>(ref ? url : null, get, {
    /**
     * on project creation, the service_api_keys will be populated with a delay
     * check for data.services.service_api_keys, return a valid refresh interval if it's empty
     */
    refreshInterval: function (data: any) {
      const apiService = (data?.services ?? []).find(
        (x: any) => x.app.id == DEFAULT_PROJECT_API_SERVICE_ID
      )
      const apiKeys = apiService?.service_api_keys ?? []
      const interval = apiKeys.length === 0 ? 2000 : 0
      return interval
    },
  })
  const anyError = data?.error || error

  return {
    mutateSettings: mutate,
    project: anyError ? undefined : data?.project,
    services: anyError ? undefined : data?.services,
    error: anyError,
    isLoading: !anyError && !data,
    isError: !!anyError,
  }
}
