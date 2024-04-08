import { useProjectApiQuery } from 'data/config/project-api-query'

export const useProjectConnectionData = (projectRef: string) => {
  const { data } = useProjectApiQuery({ projectRef })

  // the default host is prod until the correct one comes through an API call.
  const endpoint = data
    ? `${data.autoApiService.protocol}://${data.autoApiService.endpoint}`
    : `https://${projectRef}.supabase.co`

  const apiService = data?.autoApiService
  const accessToken = apiService?.service_api_keys.find((x) => x.name === 'service_role key')
    ? apiService.serviceApiKey
    : undefined

  return { endpoint, accessToken, isReady: !!(endpoint && accessToken) }
}
