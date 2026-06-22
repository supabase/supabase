import type { components } from 'api-types'

export type PrivateApp = components['schemas']['ListPlatformAppsResponse']['apps'][number]
export type Installation = components['schemas']['InstallPlatformAppResponse'] & {
  // Project scope is not yet in the API — tracked locally for the UI
  projectScope: 'all' | string[]
}
