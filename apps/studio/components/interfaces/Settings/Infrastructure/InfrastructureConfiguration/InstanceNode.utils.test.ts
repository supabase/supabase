import { describe, expect, it } from 'vitest'

import { metricColor } from './InstanceNode.utils'

describe('metricColor', () => {
  it('returns warning color at 80%', () => {
    expect(metricColor(80)).toBe('text-warning')
  })

  it('returns warning color between 80% and 90%', () => {
    expect(metricColor(85)).toBe('text-warning')
    expect(metricColor(89)).toBe('text-warning')
  })

  it('returns destructive color at 90%', () => {
    expect(metricColor(90)).toBe('text-destructive')
  })

  it('returns destructive color above 90%', () => {
    expect(metricColor(95)).toBe('text-destructive')
    expect(metricColor(100)).toBe('text-destructive')
  })

  it('returns light foreground color below 80%', () => {
    expect(metricColor(0)).toBe('text-foreground-light')
    expect(metricColor(50)).toBe('text-foreground-light')
    expect(metricColor(79)).toBe('text-foreground-light')
  })
})
