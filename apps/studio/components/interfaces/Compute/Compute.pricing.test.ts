import { describe, expect, it } from 'vitest'

import { COMPUTE_GB_PER_VCPU, estimateComputeOverage } from './Compute.pricing'

describe('estimateComputeOverage', () => {
  it('reports nothing while usage is inside the quota', () => {
    expect(estimateComputeOverage(7.2, 500 / 60)).toBeNull()
    expect(estimateComputeOverage(500 / 60, 500 / 60)).toBeNull()
  })

  it('reports nothing when the plan sets no quota to exceed', () => {
    expect(estimateComputeOverage(120, null)).toBeNull()
  })

  it('bills only the hours past the quota, not the whole period', () => {
    const overage = estimateComputeOverage(10, 8)

    expect(overage?.vcpuHours).toBeCloseTo(2, 10)
  })

  it('derives GB-hours from the overage rather than taking them separately', () => {
    // Memory is pinned per vCPU, so the two dimensions cannot drift apart in the display.
    const overage = estimateComputeOverage(10, 8)

    expect(overage?.gbHours).toBeCloseTo(2 * COMPUTE_GB_PER_VCPU, 10)
  })

  it('totals the two dimensions that the rate card prices', () => {
    const overage = estimateComputeOverage(10, 8)

    expect(overage?.total).toBeCloseTo((overage?.vcpuCost ?? 0) + (overage?.gbCost ?? 0), 10)
    expect(overage?.total).toBeGreaterThan(0)
  })
})
