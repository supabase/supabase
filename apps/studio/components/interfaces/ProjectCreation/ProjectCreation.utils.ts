import { DesiredInstanceSize, instanceSizeSpecs } from 'data/projects/new-project.constants'
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
      return AWS_REGIONS
    case 'AWS_NIMBUS':
      if (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod') {
        // Only allow Southeast Asia for Nimbus (local/staging)
        return {
          SOUTHEAST_ASIA: AWS_REGIONS.SOUTHEAST_ASIA,
        }
      }

      // Only allow US East for Nimbus (prod)
      return {
        EAST_US: AWS_REGIONS.EAST_US,
      }
    case 'FLY':
      return FLY_REGIONS
    default:
      throw new Error('Invalid cloud provider')
  }
}

/**
 * When launching new projects, they only get assigned a compute size once successfully launched,
 * this might assume wrong compute size, but only for projects being rapidly launched after one another on non-default compute sizes.
 *
 * Needs to be in the API in the future [kevin]
 */
export const monthlyInstancePrice = (instance: string | undefined): number => {
  return instanceSizeSpecs[instance as DesiredInstanceSize]?.priceMonthly || 10
}

export const instanceLabel = (instance: string | undefined): string => {
  return instanceSizeSpecs[instance as DesiredInstanceSize]?.label || 'Micro'
}
