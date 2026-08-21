import { AWS_REGIONS } from 'shared-data'
import { describe, expect, it } from 'vitest'

import { getDefaultRegionCandidateKeys } from './get-default-region-query'

describe('getDefaultRegionCandidateKeys', () => {
  it('returns all AWS regions for the AWS provider', () => {
    expect(getDefaultRegionCandidateKeys('AWS', undefined, 'prod')).toEqual(
      Object.keys(AWS_REGIONS)
    )
  })

  it.each([
    ['prod', ['EAST_US']],
    ['staging', ['SOUTHEAST_ASIA']],
    ['local', ['SOUTHEAST_ASIA']],
  ])('restricts AWS_NIMBUS to its only available region on %s', (environment, expectedKeys) => {
    expect(getDefaultRegionCandidateKeys('AWS_NIMBUS', undefined, environment)).toEqual(
      expectedKeys
    )
  })

  it('narrows the provider regions to the restricted pool', () => {
    expect(getDefaultRegionCandidateKeys('AWS', ['EAST_US', 'SOUTHEAST_ASIA'], 'prod')).toEqual([
      'EAST_US',
      'SOUTHEAST_ASIA',
    ])
  })

  it('never returns a region the provider does not offer, even if the restricted pool contains it', () => {
    expect(
      getDefaultRegionCandidateKeys('AWS_NIMBUS', ['EAST_US', 'SOUTHEAST_ASIA'], 'prod')
    ).toEqual(['EAST_US'])
  })

  it('ignores a restricted pool that excludes every provider region', () => {
    expect(getDefaultRegionCandidateKeys('AWS_NIMBUS', ['SOUTHEAST_ASIA'], 'prod')).toEqual([
      'EAST_US',
    ])
  })
})
