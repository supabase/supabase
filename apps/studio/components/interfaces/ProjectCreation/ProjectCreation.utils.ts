import { AWS_REGIONS, CloudProvider, FLY_REGIONS, Region } from 'lib/constants'
import { pluckObjectFields } from 'lib/helpers'

export function getAvailableRegions(cloudProvider: CloudProvider): Region {
  if (cloudProvider === 'AWS') {
    return process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
      ? // [Joshen] TEMP FIX, CHANGE BACK TO APSE1
        pluckObjectFields(AWS_REGIONS, ['NORTHEAST_ASIA'])
      : AWS_REGIONS
  } else if (cloudProvider === 'FLY') {
    return FLY_REGIONS
  }

  throw new Error('Invalid cloud provider')
}
