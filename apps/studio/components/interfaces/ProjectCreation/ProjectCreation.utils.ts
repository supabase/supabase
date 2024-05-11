import { AWS_REGIONS, CloudProvider, FLY_REGIONS, Region } from 'lib/constants'
import { pluckObjectFields } from 'lib/helpers'

export function getAvailableRegions(cloudProvider: CloudProvider): Region {
  if (cloudProvider === 'AWS') {
    return process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
      ? pluckObjectFields(AWS_REGIONS, ['SOUTHEAST_ASIA'])
      : AWS_REGIONS
  } else if (cloudProvider === 'FLY') {
    return FLY_REGIONS
  }

  throw new Error('Invalid cloud provider')
}
