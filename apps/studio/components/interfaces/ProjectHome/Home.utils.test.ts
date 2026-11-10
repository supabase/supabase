import { describe, expect, it } from 'vitest'

import { mergeSectionOrder } from './Home.utils'

describe('mergeSectionOrder', () => {
  it('keeps the old advisor row position when migrating to issues', () => {
    expect(mergeSectionOrder(['advisor', 'custom-report', 'connect', 'usage'])).toEqual([
      'issues',
      'custom-report',
      'connect',
      'usage',
    ])
  })

  it('keeps a single issues row if both old and new keys are stored', () => {
    expect(mergeSectionOrder(['advisor', 'issues', 'connect', 'usage', 'custom-report'])).toEqual([
      'issues',
      'connect',
      'usage',
      'custom-report',
    ])
  })

  it('returns stored order unchanged when it matches defaults', () => {
    const stored = ['connect', 'usage', 'issues', 'custom-report']
    expect(mergeSectionOrder(stored)).toBe(stored)
  })

  it('inserts missing sections at their default-relative position', () => {
    expect(mergeSectionOrder(['usage', 'issues', 'custom-report'])).toEqual([
      'connect',
      'usage',
      'issues',
      'custom-report',
    ])
  })

  it('preserves user reordering while inserting missing sections', () => {
    expect(mergeSectionOrder(['issues', 'usage', 'custom-report'])).toEqual([
      'issues',
      'connect',
      'usage',
      'custom-report',
    ])
  })

  it('strips unknown sections from stored order', () => {
    expect(mergeSectionOrder(['usage', 'deleted-section', 'issues', 'custom-report'])).toEqual([
      'connect',
      'usage',
      'issues',
      'custom-report',
    ])
  })

  it('strips legacy getting-started from stored order', () => {
    expect(
      mergeSectionOrder(['connect', 'getting-started', 'usage', 'issues', 'custom-report'])
    ).toEqual(['connect', 'usage', 'issues', 'custom-report'])
  })
})
