import { AWS_REGIONS } from 'shared-data'
import { describe, expect, it } from 'vitest'

import {
  HIGH_AVAILABILITY_INSTANCE_SIZE,
  HIGH_AVAILABILITY_POSTGRES_ENGINE,
  HIGH_AVAILABILITY_RELEASE_CHANNEL,
} from './ProjectCreation.constants'
import {
  filterHighAvailabilityRegions,
  getAvailableRegions,
  getHighAvailabilityRegionCode,
  resolveDefaultDbRegion,
} from './ProjectCreation.utils'

describe('resolveDefaultDbRegion', () => {
  const base = {
    cloudProvider: 'AWS_NIMBUS',
    isHighAvailabilityRestricted: false,
    highAvailabilityRegionName: undefined,
    isSmartRegionEnabled: false,
    recommendedSmartRegion: undefined,
    autoDefaultRegion: undefined,
    fixedDefaultRegion: AWS_REGIONS.EAST_US.displayName,
    environment: 'prod',
  } as const

  it('prefers the high availability region when restricted, even while it is still loading', () => {
    expect(
      resolveDefaultDbRegion({
        ...base,
        isHighAvailabilityRestricted: true,
        highAvailabilityRegionName: AWS_REGIONS.EAST_US.displayName,
      })
    ).toBe(AWS_REGIONS.EAST_US.displayName)
    expect(resolveDefaultDbRegion({ ...base, isHighAvailabilityRestricted: true })).toBeUndefined()
  })

  it('uses the recommended smart region when smart regions are enabled', () => {
    expect(
      resolveDefaultDbRegion({
        ...base,
        cloudProvider: 'AWS',
        isSmartRegionEnabled: true,
        recommendedSmartRegion: 'Americas',
        autoDefaultRegion: AWS_REGIONS.SOUTHEAST_ASIA.displayName,
      })
    ).toBe('Americas')
  })

  it('uses the geolocated region when the provider offers it', () => {
    expect(
      resolveDefaultDbRegion({
        ...base,
        cloudProvider: 'AWS',
        autoDefaultRegion: AWS_REGIONS.SOUTHEAST_ASIA.displayName,
      })
    ).toBe(AWS_REGIONS.SOUTHEAST_ASIA.displayName)
  })

  it('falls back to the fixed default when the provider does not offer the geolocated region', () => {
    expect(
      resolveDefaultDbRegion({ ...base, autoDefaultRegion: AWS_REGIONS.SOUTHEAST_ASIA.displayName })
    ).toBe(AWS_REGIONS.EAST_US.displayName)
  })

  it('falls back to the fixed default when no geolocated region resolved', () => {
    expect(resolveDefaultDbRegion(base)).toBe(AWS_REGIONS.EAST_US.displayName)
  })
})

describe('getAvailableRegions', () => {
  it.each(['local', 'staging', 'prod'])('returns all AWS regions for AWS on %s', (environment) => {
    expect(getAvailableRegions('AWS', environment)).toEqual(AWS_REGIONS)
    expect(getAvailableRegions('AWS_K8S', environment)).toEqual(AWS_REGIONS)
  })

  it.each([
    ['local', { SOUTHEAST_ASIA: AWS_REGIONS.SOUTHEAST_ASIA }],
    ['staging', { SOUTHEAST_ASIA: AWS_REGIONS.SOUTHEAST_ASIA }],
    ['prod', { EAST_US: AWS_REGIONS.EAST_US }],
  ])('returns the single AWS_NIMBUS region on %s', (environment, expectedRegions) => {
    expect(getAvailableRegions('AWS_NIMBUS', environment)).toEqual(expectedRegions)
  })
})

describe('High Availability project creation constraints', () => {
  it('pins the Alpha Postgres engine, release channel, and compute size', () => {
    expect(HIGH_AVAILABILITY_POSTGRES_ENGINE).toBe('17')
    expect(HIGH_AVAILABILITY_RELEASE_CHANNEL).toBe('ga')
    expect(HIGH_AVAILABILITY_INSTANCE_SIZE).toBe('large')
  })

  it.each([
    ['local', 'eu-central-1'],
    ['staging', 'us-east-1'],
    ['prod', 'us-east-1'],
  ])('resolves the %s region restriction', (environment, expectedRegion) => {
    expect(getHighAvailabilityRegionCode(environment)).toBe(expectedRegion)
  })

  it.each([
    ['local', undefined],
    ['staging', 'us-east-1'],
    ['prod', 'us-east-1'],
  ])(
    'applies the %s region restriction to high availability projects',
    (environment, expectedRegion) => {
      const regions = [{ code: 'us-east-1' }, { code: 'eu-central-1' }, { code: 'ap-southeast-1' }]

      expect(filterHighAvailabilityRegions(regions, true, environment)).toEqual(
        expectedRegion === undefined ? regions : [{ code: expectedRegion }]
      )
      expect(filterHighAvailabilityRegions(regions, false, environment)).toEqual(regions)
    }
  )
})
