import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { COUNTRY_LAT_LON } from 'components/interfaces/ProjectCreation/ProjectCreation.constants'
import {
  AWS_REGIONS_COORDINATES,
  FLY_REGIONS_COORDINATES,
} from 'components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { fetchHandler } from 'data/fetchers'
import { useFlag } from 'hooks/ui/useFlag'
import { getDistanceLatLonKM, tryParseJson } from 'lib/helpers'
import type { CloudProvider } from 'shared-data'
import { AWS_REGIONS, FLY_REGIONS } from 'shared-data'
import type { ResponseError } from 'types'
import { miscKeys } from './keys'

export type DefaultRegionVariables = {
  cloudProvider?: CloudProvider
  restrictedPool?: string[]
  useRestrictedPool?: boolean
}

export async function getDefaultRegionOption({
  cloudProvider,
  restrictedPool,
  useRestrictedPool = true,
}: DefaultRegionVariables) {
  if (!cloudProvider) throw new Error('Cloud provider is required')

  try {
    const data = await fetchHandler('https://www.cloudflare.com/cdn-cgi/trace').then((res) =>
      res.text()
    )
    const locationCode: keyof typeof COUNTRY_LAT_LON = Object.fromEntries(
      data.split('\n').map((item) => item.split('='))
    )['loc']
    const locLatLon = COUNTRY_LAT_LON[locationCode]

    if (locLatLon === undefined) return undefined

    const isAWSProvider = ['AWS', 'AWS_K8S'].includes(cloudProvider)

    const allRegions = isAWSProvider ? AWS_REGIONS_COORDINATES : FLY_REGIONS_COORDINATES
    const locations =
      useRestrictedPool && restrictedPool
        ? Object.entries(allRegions)
            .filter((x) => restrictedPool.includes(x[0]))
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

    return isAWSProvider
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
) => {
  // [Joshen] Flag allows us to specify restricted regions for users based on percentage
  const restrictedPoolFlag = useFlag('defaultRegionRestrictedPool')
  const restrictedPool = tryParseJson(restrictedPoolFlag)

  return useQuery<DefaultRegionData, DefaultRegionError, TData>(
    miscKeys.defaultRegion(cloudProvider, useRestrictedPool ?? true),
    () => getDefaultRegionOption({ cloudProvider, restrictedPool, useRestrictedPool }),
    {
      enabled:
        enabled && typeof cloudProvider !== 'undefined' && typeof restrictedPool !== 'undefined',
      retry(failureCount) {
        return failureCount < 1
      },
      ...options,
    }
  )
}
