import { describe, expect, it } from 'vitest'

import { getComputeCpuLabel, getComputeSizeLabel, isSharedComputeSize } from './compute-labels'

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

describe('getComputeSizeLabel', () => {
  it('maps infra compute sizes to display labels', () => {
    expect(getComputeSizeLabel('nano')).toBe('Nano')
    expect(getComputeSizeLabel('medium')).toBe('Medium')
    expect(getComputeSizeLabel('xlarge')).toBe('XL')
    expect(getComputeSizeLabel('2xlarge')).toBe('2XL')
    expect(getComputeSizeLabel('48xlarge_high_memory')).toBe('48XL - High Memory')
  })

  it('accepts addon variant identifiers and mixed case', () => {
    expect(getComputeSizeLabel('ci_micro')).toBe('Micro')
    expect(getComputeSizeLabel('Medium')).toBe('Medium')
  })

  it('returns undefined for unknown or missing values instead of leaking them', () => {
    expect(getComputeSizeLabel('t4g.small')).toBeUndefined()
    expect(getComputeSizeLabel(undefined)).toBeUndefined()
    expect(getComputeSizeLabel(null)).toBeUndefined()
  })
})
