import type { components } from 'api-types'

export type PrivateApp = components['schemas']['ListPlatformAppsResponse_Output']['apps'][number]
export type Installation = components['schemas']['InstallPlatformAppResponse_Output'] & {
  // Project scope is not yet in the API — tracked locally for the UI
  projectScope: 'all' | string[]
}
