import { describe, expect, it } from 'vitest'

import {
  filterHighAvailabilityRegions,
  getHighAvailabilityRegionCode,
  HIGH_AVAILABILITY_POSTGRES_ENGINE,
  HIGH_AVAILABILITY_POSTGRES_VERSION,
  HIGH_AVAILABILITY_RELEASE_CHANNEL,
} from './ProjectCreation.constants'

describe('High Availability project creation constraints', () => {
  it('pins the Alpha Postgres image version', () => {
    expect(HIGH_AVAILABILITY_POSTGRES_VERSION).toBe('17.6.1.147')
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
    ['local', 'eu-central-1'],
    ['staging', 'us-east-1'],
    ['prod', undefined],
  ])('limits %s projects to the required region', (environment, expectedRegion) => {
    const regions = [{ code: 'us-east-1' }, { code: 'eu-central-1' }]

    expect(filterHighAvailabilityRegions(regions, true, environment)).toEqual(
      expectedRegion === undefined ? regions : [{ code: expectedRegion }]
    )
    expect(filterHighAvailabilityRegions(regions, false, environment)).toEqual(regions)
  })
})
