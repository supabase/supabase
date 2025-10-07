import type { CloudProvider, Region } from 'shared-data'
import { AWS_REGIONS, FLY_REGIONS } from 'shared-data'
import { SMART_REGION_TO_EXACT_REGION_MAP } from 'shared-data/regions'

export function smartRegionToExactRegion(smartOrExactRegion: string) {
  return SMART_REGION_TO_EXACT_REGION_MAP.get(smartOrExactRegion) ?? smartOrExactRegion
}

export function getAvailableRegions(cloudProvider: CloudProvider): Region {
  switch (cloudProvider) {
    case 'AWS':
    case 'AWS_K8S':
    case 'AWS_NIMBUS':
      return AWS_REGIONS
    case 'FLY':
      return FLY_REGIONS
    default:
      throw new Error('Invalid cloud provider')
  }
}
