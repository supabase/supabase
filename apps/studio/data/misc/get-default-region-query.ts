import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { ResponseError } from 'types'
import { miscKeys } from './keys'
import { COUNTRY_LAT_LON } from 'components/interfaces/ProjectCreation/ProjectCreation.constants'
import { getDistanceLatLonKM } from 'lib/helpers'
import {
  AWS_REGIONS_COORDINATES,
  FLY_REGIONS_COORDINATES,
} from 'components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import type { CloudProvider } from 'shared-data'
import { AWS_REGIONS, FLY_REGIONS } from 'shared-data'

const RESTRICTED_POOL = ['WEST_US', 'CENTRAL_EU', 'SOUTHEAST_ASIA']

export type DefaultRegionVariables = {
  cloudProvider?: CloudProvider
  useRestrictedPool?: boolean
}

export async function getDefaultRegionOption({
  cloudProvider,
  useRestrictedPool = true,
}: DefaultRegionVariables) {
  if (!cloudProvider) throw new Error('Cloud provider is required')

  try {
    const data = await fetch('https://www.cloudflare.com/cdn-cgi/trace').then((res) => res.text())
    const locationCode: keyof typeof COUNTRY_LAT_LON = Object.fromEntries(
      data.split('\n').map((item) => item.split('='))
    )['loc']
    const locLatLon = COUNTRY_LAT_LON[locationCode]

    if (locLatLon === undefined) return undefined

    const allRegions = cloudProvider === 'AWS' ? AWS_REGIONS_COORDINATES : FLY_REGIONS_COORDINATES
    const locations = useRestrictedPool
      ? Object.entries(allRegions)
          .filter((x) => RESTRICTED_POOL.includes(x[0]))
          .reduce((o, val) => ({ ...o, [val[0]]: val[1] }), {})
      : allRegions

    const distances = Object.keys(locations).map((reg) => {
      const region: { lat: number; lon: number } = {
        lat: locations[reg as keyof typeof locations][1],
        lon: locations[reg as keyof typeof locations][0],
      }
      return getDistanceLatLonKM(locLatLon.lat, locLatLon.lon, region.lat, region.lon)
    })
    const shortestDistance = Math.min(...distances)
    const closestRegion = Object.keys(locations)[distances.indexOf(shortestDistance)]

    return cloudProvider === 'AWS'
      ? AWS_REGIONS[closestRegion as keyof typeof AWS_REGIONS].displayName
      : FLY_REGIONS[closestRegion as keyof typeof FLY_REGIONS].displayName
  } catch (error) {
    throw error
  }
}

export type DefaultRegionData = Awaited<ReturnType<typeof getDefaultRegionOption>>
export type DefaultRegionError = ResponseError

export const useDefaultRegionQuery = <TData = DefaultRegionData>(
  { cloudProvider, useRestrictedPool }: DefaultRegionVariables,
  { enabled = true, ...options }: UseQueryOptions<DefaultRegionData, DefaultRegionError, TData> = {}
) =>
  useQuery<DefaultRegionData, DefaultRegionError, TData>(
    miscKeys.defaultRegion(cloudProvider, useRestrictedPool ?? true),
    () => getDefaultRegionOption({ cloudProvider, useRestrictedPool }),
    {
      enabled: enabled && typeof cloudProvider !== 'undefined',
      retry(failureCount) {
        return failureCount < 1
      },
      ...options,
    }
  )
