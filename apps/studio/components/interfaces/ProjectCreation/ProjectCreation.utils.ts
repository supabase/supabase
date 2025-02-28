import type { CloudProvider, Region } from 'shared-data'
import { AWS_REGIONS, FLY_REGIONS } from 'shared-data'

export function getAvailableRegions(cloudProvider: CloudProvider): Region {
  switch (cloudProvider) {
    case 'AWS':
    case 'AWS_NEW':
      return AWS_REGIONS
    case 'FLY':
      return FLY_REGIONS
    default:
      throw new Error('Invalid cloud provider')
  }
}
