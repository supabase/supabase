import type { CloudProvider, Region } from 'shared-data'
import { AWS_REGIONS, FLY_REGIONS } from 'shared-data'

export function getAvailableRegions(cloudProvider: CloudProvider): Region {
  if (cloudProvider === 'AWS') {
    return AWS_REGIONS
  } else if (cloudProvider === 'FLY') {
    return FLY_REGIONS
  }

  throw new Error('Invalid cloud provider')
}
