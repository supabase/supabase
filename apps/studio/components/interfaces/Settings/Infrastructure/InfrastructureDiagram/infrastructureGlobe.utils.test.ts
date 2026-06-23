import { describe, expect, it } from 'vitest'

import { INFRASTRUCTURE_MOCK_CONFIG } from '../Infrastructure.mock'
import {
  buildInfrastructureGlobeMarkers,
  getRecommendedReplicaRegions,
  getRegionGlobeLocation,
} from './infrastructureGlobe.utils'

const MOCK_MARKER_COLORS = {
  primary: [0.1, 0.1, 0.1] as [number, number, number],
  replica: [0.1, 0.1, 0.1] as [number, number, number],
  recommended: [0.45, 0.45, 0.45] as [number, number, number],
}

describe('infrastructureGlobe.utils', () => {
  it('resolves AWS region codes to lat/lng', () => {
    expect(getRegionGlobeLocation('us-east-1')).toEqual([37.926868, -78.024902])
  })

  it('recommends undeployed regions for performance', () => {
    const recommended = getRecommendedReplicaRegions(INFRASTRUCTURE_MOCK_CONFIG)

    expect(recommended).not.toContain('us-east-1')
    expect(recommended).not.toContain('us-west-2')
    expect(recommended.length).toBeGreaterThan(0)
    expect(recommended.length).toBeLessThanOrEqual(3)
  })

  it('builds primary, replica, and recommended markers', () => {
    const markers = buildInfrastructureGlobeMarkers(INFRASTRUCTURE_MOCK_CONFIG, MOCK_MARKER_COLORS)
    const roles = markers.map((marker) => marker.role)

    expect(roles).toContain('primary')
    expect(roles).toContain('replica')
    expect(roles.filter((role) => role === 'replica')).toHaveLength(1)
    expect(roles).toContain('recommended')
  })
})
