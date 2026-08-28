import { useQuery } from '@tanstack/react-query'
import { useFlag } from 'common'
import type { CloudProvider } from 'shared-data'
import { AWS_REGIONS } from 'shared-data'

import { miscKeys } from './keys'
import { COUNTRY_LAT_LON } from '@/components/interfaces/ProjectCreation/ProjectCreation.constants'
import { getAvailableRegions } from '@/components/interfaces/ProjectCreation/ProjectCreation.utils'
import { AWS_REGIONS_COORDINATES } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { fetchHandler } from '@/data/fetchers'
import { getDistanceLatLonKM, tryParseJson } from '@/lib/helpers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type DefaultRegionVariables = {
  cloudProvider?: CloudProvider
  restrictedPool?: string[]
  useRestrictedPool?: boolean
}

// The geolocation-based default may only ever pick a region the selected cloud provider
// actually offers (e.g. AWS_NIMBUS is restricted to a single region). The flag-based
// restricted pool narrows within that set, and is ignored if it would leave no candidates.
export function getDefaultRegionCandidateKeys(
  cloudProvider: CloudProvider,
  restrictedPool?: string[],
  environment = process.env.NEXT_PUBLIC_ENVIRONMENT
) {
  const providerRegionKeys = Object.keys(getAvailableRegions(cloudProvider, environment))
  const pooledRegionKeys = restrictedPool
    ? providerRegionKeys.filter((key) => restrictedPool.includes(key))
    : providerRegionKeys
  return pooledRegionKeys.length > 0 ? pooledRegionKeys : providerRegionKeys
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

    const candidateKeys = getDefaultRegionCandidateKeys(
      cloudProvider,
      useRestrictedPool ? restrictedPool : undefined
    )
    const locations = Object.fromEntries(
      Object.entries(AWS_REGIONS_COORDINATES).filter(([key]) => candidateKeys.includes(key))
    )

    const distances = Object.keys(locations).map((reg) => {
      const region: { lat: number; lon: number } = {
        lat: locations[reg][1],
        lon: locations[reg][0],
      }
      return getDistanceLatLonKM(locLatLon.lat, locLatLon.lon, region.lat, region.lon)
    })
    const shortestDistance = Math.min(...distances)
    const closestRegion = Object.keys(locations)[distances.indexOf(shortestDistance)]

    return AWS_REGIONS[closestRegion as keyof typeof AWS_REGIONS].displayName
  } catch (error) {
    throw error
  }
}

export type DefaultRegionData = Awaited<ReturnType<typeof getDefaultRegionOption>>
export type DefaultRegionError = ResponseError

export const useDefaultRegionQuery = <TData = DefaultRegionData>(
  { cloudProvider, useRestrictedPool }: DefaultRegionVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<DefaultRegionData, DefaultRegionError, TData> = {}
) => {
  // [Joshen] Flag allows us to specify restricted regions for users based on percentage
  const restrictedPoolFlag = useFlag('defaultRegionRestrictedPool')
  const restrictedPool = tryParseJson(restrictedPoolFlag)

  return useQuery<DefaultRegionData, DefaultRegionError, TData>({
    queryKey: miscKeys.defaultRegion(cloudProvider, useRestrictedPool ?? true),
    queryFn: () => getDefaultRegionOption({ cloudProvider, restrictedPool, useRestrictedPool }),
    enabled:
      enabled && typeof cloudProvider !== 'undefined' && typeof restrictedPool !== 'undefined',
    retry(failureCount) {
      return failureCount < 1
    },
    ...options,
  })
}
