import { describe, expect, it } from 'vitest'

import { getComputeCpuLabel, isSharedComputeSize } from './compute-labels'

describe('isSharedComputeSize', () => {
  it('treats sizes below Large as shared', () => {
    expect(isSharedComputeSize('pico')).toBe(true)
    expect(isSharedComputeSize('nano')).toBe(true)
    expect(isSharedComputeSize('micro')).toBe(true)
    expect(isSharedComputeSize('small')).toBe(true)
    expect(isSharedComputeSize('medium')).toBe(true)
  })

  it('treats Large and up as dedicated', () => {
    expect(isSharedComputeSize('large')).toBe(false)
    expect(isSharedComputeSize('xlarge')).toBe(false)
    expect(isSharedComputeSize('16xlarge')).toBe(false)
    expect(isSharedComputeSize('48xlarge_high_memory')).toBe(false)
  })

  it('accepts addon variant identifiers and mixed case', () => {
    expect(isSharedComputeSize('ci_micro')).toBe(true)
    expect(isSharedComputeSize('ci_large')).toBe(false)
    expect(isSharedComputeSize('Medium')).toBe(true)
  })
})

describe('getComputeCpuLabel', () => {
  it('labels shared sizes without a count', () => {
    expect(getComputeCpuLabel('micro', 2)).toBe('Shared compute')
    expect(getComputeCpuLabel('medium')).toBe('Shared compute')
  })

  it('labels dedicated sizes with a vCPU count', () => {
    expect(getComputeCpuLabel('large', 2)).toBe('Dedicated · 2 vCPUs')
    expect(getComputeCpuLabel('16xlarge', 64)).toBe('Dedicated · 64 vCPUs')
  })

  it('falls back to a generic dedicated label without a count', () => {
    expect(getComputeCpuLabel('large')).toBe('Dedicated compute')
  })
})
