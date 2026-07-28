import { describe, expect, it } from 'vitest'

import {
  filterHighAvailabilityRegions,
  getHighAvailabilityRegionCode,
  HIGH_AVAILABILITY_POSTGRES_VERSION,
} from './ProjectCreation.constants'

describe('High Availability project creation constraints', () => {
  it('pins the Alpha Postgres image version', () => {
    expect(HIGH_AVAILABILITY_POSTGRES_VERSION).toBe('17.6.1.147')
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
  ])('limits %s projects to the required region', (environment, expectedRegion) => {
    const regions = [{ code: 'us-east-1' }, { code: 'eu-central-1' }]

    expect(filterHighAvailabilityRegions(regions, true, environment)).toEqual([
      { code: expectedRegion },
    ])
    expect(filterHighAvailabilityRegions(regions, false, environment)).toEqual(regions)
  })
})
