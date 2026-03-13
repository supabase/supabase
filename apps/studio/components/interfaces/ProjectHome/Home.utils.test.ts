import { describe, expect, it } from 'vitest'

import { mergeSectionOrder, getSectionVisibility } from './Home.utils'

describe('mergeSectionOrder', () => {
  it('returns stored order unchanged when it matches defaults', () => {
    const stored = ['connect', 'getting-started', 'usage', 'advisor', 'custom-report']
    expect(mergeSectionOrder(stored)).toBe(stored)
  })

  it('inserts missing sections at their default-relative position', () => {
    expect(mergeSectionOrder(['usage', 'advisor', 'custom-report'])).toEqual([
      'connect',
      'getting-started',
      'usage',
      'advisor',
      'custom-report',
    ])
  })

  it('preserves user reordering while inserting missing sections', () => {
    expect(mergeSectionOrder(['getting-started', 'advisor', 'usage', 'custom-report'])).toEqual([
      'connect',
      'getting-started',
      'advisor',
      'usage',
      'custom-report',
    ])
  })

  it('strips unknown sections from stored order', () => {
    expect(mergeSectionOrder(['usage', 'deleted-section', 'advisor', 'custom-report'])).toEqual([
      'connect',
      'getting-started',
      'usage',
      'advisor',
      'custom-report',
    ])
  })
})

describe('getSectionVisibility', () => {
  const base = {
    connectSectionVariant: 'connect' as const,
    isMatureProject: false,
    hasProject: true,
    gettingStartedState: 'empty' as const,
  }

  it('shows connect section for connect variant on new project', () => {
    expect(getSectionVisibility(base)).toEqual({
      showConnectSection: true,
      showGettingStarted: false,
    })
  })

  it('shows getting started for non-connect variant', () => {
    expect(getSectionVisibility({ ...base, connectSectionVariant: 'getting-started' })).toEqual({
      showConnectSection: false,
      showGettingStarted: true,
    })
  })

  it('shows neither when flag is unresolved', () => {
    expect(getSectionVisibility({ ...base, connectSectionVariant: undefined })).toEqual({
      showConnectSection: false,
      showGettingStarted: false,
    })
  })

  it('shows neither for mature projects', () => {
    expect(getSectionVisibility({ ...base, isMatureProject: true })).toEqual({
      showConnectSection: false,
      showGettingStarted: false,
    })
  })

  it('hides getting started when user dismissed it', () => {
    expect(
      getSectionVisibility({
        ...base,
        connectSectionVariant: 'getting-started',
        gettingStartedState: 'hidden',
      })
    ).toEqual({
      showConnectSection: false,
      showGettingStarted: false,
    })
  })

  it('shows getting started when flag resolved to false (control group)', () => {
    expect(getSectionVisibility({ ...base, connectSectionVariant: false })).toEqual({
      showConnectSection: false,
      showGettingStarted: true,
    })
  })

  it('shows neither when project is missing', () => {
    expect(getSectionVisibility({ ...base, hasProject: false })).toEqual({
      showConnectSection: false,
      showGettingStarted: false,
    })
  })
})
