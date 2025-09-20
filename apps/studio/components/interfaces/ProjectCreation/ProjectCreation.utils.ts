import type { CloudProvider, Region } from 'shared-data'
import { AWS_REGIONS, FLY_REGIONS } from 'shared-data'

const smartRegionToExactRegionMap = new Map([
  ['Americas', 'East US (North Virginia)'],
  ['Europe', 'Central EU (Frankfurt)'],
  ['APAC', 'Southeast Asia (Singapore)'],
])

export function smartRegionToExactRegion(smartOrExactRegion: string) {
  return smartRegionToExactRegionMap.get(smartOrExactRegion) ?? smartOrExactRegion
}

export function getAvailableRegions(cloudProvider: CloudProvider): Region {
  switch (cloudProvider) {
    case 'AWS':
    case 'AWS_K8S':
      return AWS_REGIONS
    case 'AWS_NIMBUS':
      // Only allow US East for Nimbus
      return {
        EAST_US: AWS_REGIONS.EAST_US,
      }
    case 'FLY':
      return FLY_REGIONS
    default:
      throw new Error('Invalid cloud provider')
  }
}
