import { AWS_REGIONS } from 'shared-data'
import { describe, expect, it } from 'vitest'

import {
  AVAILABLE_REPLICA_REGIONS,
  AWS_REGIONS_COORDINATES,
} from './InstanceConfiguration.constants'

describe('AVAILABLE_REPLICA_REGIONS', () => {
  it('covers every AWS region', () => {
    expect(AVAILABLE_REPLICA_REGIONS.map((region) => region.key).sort()).toEqual(
      Object.keys(AWS_REGIONS).sort()
    )
  })

  it('has coordinates for every AWS region', () => {
    expect(Object.keys(AWS_REGIONS_COORDINATES).sort()).toEqual(Object.keys(AWS_REGIONS).sort())
    AVAILABLE_REPLICA_REGIONS.forEach((region) => {
      expect(region.coordinates).toHaveLength(2)
    })
  })
})
