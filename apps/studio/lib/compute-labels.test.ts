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
  it.each([
    ['pico', 'Pico'],
    ['nano', 'Nano'],
    ['micro', 'Micro'],
    ['small', 'Small'],
    ['medium', 'Medium'],
    ['large', 'Large'],
    ['xlarge', 'XL'],
    ['2xlarge', '2XL'],
    ['4xlarge', '4XL'],
    ['8xlarge', '8XL'],
    ['12xlarge', '12XL'],
    ['16xlarge', '16XL'],
    ['24xlarge', '24XL'],
    ['24xlarge_optimized_memory', '24XL - Optimized Memory'],
    ['24xlarge_optimized_cpu', '24XL - Optimized CPU'],
    ['24xlarge_high_memory', '24XL - High Memory'],
    ['48xlarge', '48XL'],
    ['48xlarge_optimized_memory', '48XL - Optimized Memory'],
    ['48xlarge_optimized_cpu', '48XL - Optimized CPU'],
    ['48xlarge_high_memory', '48XL - High Memory'],
  ])('maps %s to %s', (size, label) => {
    expect(getComputeSizeLabel(size)).toBe(label)
  })

  it('accepts addon variant identifiers and mixed case', () => {
    expect(getComputeSizeLabel('ci_micro')).toBe('Micro')
    expect(getComputeSizeLabel('Medium')).toBe('Medium')
  })

  it('returns undefined for unknown or missing values instead of leaking them', () => {
    expect(getComputeSizeLabel('t4g.small')).toBeUndefined()
    expect(getComputeSizeLabel('')).toBeUndefined()
    expect(getComputeSizeLabel(undefined)).toBeUndefined()
    expect(getComputeSizeLabel(null)).toBeUndefined()
  })
})
