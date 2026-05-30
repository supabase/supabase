import { describe, expect, it } from 'vitest'

import { mergeSectionOrder } from './Home.utils'

describe('mergeSectionOrder', () => {
  it('returns stored order unchanged when it matches defaults', () => {
    const stored = ['connect', 'usage', 'advisor', 'custom-report']
    expect(mergeSectionOrder(stored)).toBe(stored)
  })

  it('inserts missing sections at their default-relative position', () => {
    expect(mergeSectionOrder(['usage', 'advisor', 'custom-report'])).toEqual([
      'connect',
      'usage',
      'advisor',
      'custom-report',
    ])
  })

  it('preserves user reordering while inserting missing sections', () => {
    expect(mergeSectionOrder(['advisor', 'usage', 'custom-report'])).toEqual([
      'advisor',
      'connect',
      'usage',
      'custom-report',
    ])
  })

  it('strips unknown sections from stored order', () => {
    expect(mergeSectionOrder(['usage', 'deleted-section', 'advisor', 'custom-report'])).toEqual([
      'connect',
      'usage',
      'advisor',
      'custom-report',
    ])
  })

  it('strips legacy getting-started from stored order', () => {
    expect(
      mergeSectionOrder(['connect', 'getting-started', 'usage', 'advisor', 'custom-report'])
    ).toEqual(['connect', 'usage', 'advisor', 'custom-report'])
  })
})
