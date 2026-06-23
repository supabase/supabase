import type { Marker } from 'cobe'
import { AWS_REGIONS } from 'shared-data'

import { getRegionLabel, type InfrastructureMockConfig } from '../Infrastructure.mock'

export type InfrastructureGlobeMarkerRole = 'primary' | 'replica' | 'recommended'

export type InfrastructureGlobeMarker = Marker & {
  role: InfrastructureGlobeMarkerRole
  regionCode: string
  label: string
}

export const toCobeMarker = (marker: InfrastructureGlobeMarker): Marker => ({
  id: marker.id,
  location: marker.location,
  size: marker.size,
  color: marker.color,
})

/** Regions commonly suggested when improving global read latency (prototype). */
export const PERFORMANCE_REPLICA_CANDIDATES = [
  'eu-west-1',
  'ap-southeast-1',
  'ap-northeast-1',
  'eu-central-1',
  'ap-south-1',
] as const

const REGION_LOCATION_BY_CODE: Record<string, [number, number]> = Object.values(AWS_REGIONS).reduce(
  (acc, region) => {
    acc[region.code] = region.location as [number, number]
    return acc
  },
  {} as Record<string, [number, number]>
)

export const getRegionGlobeLocation = (regionCode: string): [number, number] | undefined =>
  REGION_LOCATION_BY_CODE[regionCode]

/** Suggest replica regions not yet deployed, biased toward geographic spread from the primary. */
export const getRecommendedReplicaRegions = (config: InfrastructureMockConfig): string[] => {
  const deployed = new Set(config.regions)
  const primaryLocation = getRegionGlobeLocation(config.homeRegion)
  const candidates = PERFORMANCE_REPLICA_CANDIDATES.filter((code) => !deployed.has(code))

  if (!primaryLocation || candidates.length === 0) return candidates.slice(0, 3)

  const [primaryLat, primaryLng] = primaryLocation

  return [...candidates]
    .sort((a, b) => {
      const distA = regionDistanceScore(primaryLat, primaryLng, a)
      const distB = regionDistanceScore(primaryLat, primaryLng, b)
      return distB - distA
    })
    .slice(0, 3)
}

const regionDistanceScore = (primaryLat: number, primaryLng: number, regionCode: string) => {
  const location = getRegionGlobeLocation(regionCode)
  if (!location) return 0
  const [lat, lng] = location
  const dLat = lat - primaryLat
  const dLng = lng - primaryLng
  return dLat * dLat + dLng * dLng
}

const MARKER_SIZE: Record<InfrastructureGlobeMarkerRole, number> = {
  primary: 0.06,
  replica: 0.045,
  recommended: 0.04,
}

export type InfrastructureGlobeMarkerColors = Record<
  InfrastructureGlobeMarkerRole,
  [number, number, number]
>

export const buildInfrastructureGlobeMarkers = (
  config: InfrastructureMockConfig,
  markerColors: InfrastructureGlobeMarkerColors
): InfrastructureGlobeMarker[] => {
  const markers: InfrastructureGlobeMarker[] = []
  const primaryLocation = getRegionGlobeLocation(config.homeRegion)

  if (primaryLocation) {
    markers.push({
      role: 'primary',
      regionCode: config.homeRegion,
      label: getRegionLabel(config.homeRegion),
      location: primaryLocation,
      size: MARKER_SIZE.primary,
      color: markerColors.primary,
      id: `primary-${config.homeRegion}`,
    })
  }

  for (const regionCode of config.regions) {
    if (regionCode === config.homeRegion) continue
    const location = getRegionGlobeLocation(regionCode)
    if (!location) continue

    markers.push({
      role: 'replica',
      regionCode,
      label: getRegionLabel(regionCode),
      location,
      size: MARKER_SIZE.replica,
      color: markerColors.replica,
      id: `replica-${regionCode}`,
    })
  }

  for (const regionCode of getRecommendedReplicaRegions(config)) {
    const location = getRegionGlobeLocation(regionCode)
    if (!location) continue

    markers.push({
      role: 'recommended',
      regionCode,
      label: getRegionLabel(regionCode),
      location,
      size: MARKER_SIZE.recommended,
      color: markerColors.recommended,
      id: `recommended-${regionCode}`,
    })
  }

  return markers
}

export const buildInfrastructureGlobeArcs = (markers: InfrastructureGlobeMarker[]) => {
  const primary = markers.find((marker) => marker.role === 'primary')
  if (!primary) return []

  return markers
    .filter((marker) => marker.role !== 'primary')
    .map((marker) => ({
      from: primary.location,
      to: marker.location,
      color: marker.color,
      id: `arc-${marker.id}`,
    }))
}

export const toCobeMarkers = (markers: InfrastructureGlobeMarker[]): Marker[] =>
  markers.map(toCobeMarker)
