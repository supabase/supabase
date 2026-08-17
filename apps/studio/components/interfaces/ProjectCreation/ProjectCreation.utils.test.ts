import { AWS_REGIONS } from 'shared-data'
import { describe, expect, it } from 'vitest'

import {
  HIGH_AVAILABILITY_POSTGRES_ENGINE,
  HIGH_AVAILABILITY_RELEASE_CHANNEL,
} from './ProjectCreation.constants'
import {
  filterHighAvailabilityRegions,
  getAvailableRegions,
  getHighAvailabilityRegionCode,
} from './ProjectCreation.utils'

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
  it('pins the Alpha Postgres engine and release channel', () => {
    expect(HIGH_AVAILABILITY_POSTGRES_ENGINE).toBe('17')
    expect(HIGH_AVAILABILITY_RELEASE_CHANNEL).toBe('ga')
  })

  it.each([
    ['local', 'eu-central-1'],
    ['staging', 'us-east-1'],
    ['prod', undefined],
  ])('resolves the %s region restriction', (environment, expectedRegion) => {
    expect(getHighAvailabilityRegionCode(environment)).toBe(expectedRegion)
  })

  it.each([
    ['local', undefined],
    ['staging', 'us-east-1'],
    ['prod', undefined],
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
