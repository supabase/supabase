import { IS_PLATFORM } from 'common'

import { ProjectSettingsVariables, useProjectSettingsV2Query } from './project-settings-v2-query'

export const useProjectEndpointQuery = ({ projectRef }: ProjectSettingsVariables) => {
  return useProjectSettingsV2Query(
    { projectRef },
    {
      select: (data) => {
        const protocol = data?.app_config?.protocol ?? 'https'
        const endpoint = data?.app_config?.endpoint
        const clientEndpoint = `${IS_PLATFORM ? 'https' : protocol}://${endpoint}`
        const storageEndpoint = data?.app_config?.storage_endpoint
          ? `${IS_PLATFORM ? 'https' : protocol}://${data?.app_config?.storage_endpoint}`
          : undefined

        return { endpoint: clientEndpoint, storageEndpoint }
      },
    }
  )
}
