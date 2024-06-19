import { PROVIDERS } from './constants'

export function getCloudProviderArchitecture(cloudProvider: string | undefined) {
  switch (cloudProvider) {
    case PROVIDERS.AWS.id:
      return 'ARM'
    case PROVIDERS.FLY.id:
      return 'x86 64-bit'
    default:
      return ''
  }
}
