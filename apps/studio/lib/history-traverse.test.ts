import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import {
  installHistoryTraverseListener,
  isHistoryTraverseNavigation,
  resetHistoryTraverseState,
} from './history-traverse'

describe('isHistoryTraverseNavigation', () => {
  beforeEach(() => {
    resetHistoryTraverseState()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('is false for a fresh document navigation', () => {
    vi.spyOn(performance, 'getEntriesByType').mockImplementation((type) => {
      if (type !== 'navigation') return []
      return [{ type: 'navigate' } as PerformanceNavigationTiming]
    })

    expect(isHistoryTraverseNavigation()).toBe(false)
  })

  test('is true after a popstate and false again after a push', () => {
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([])

    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(isHistoryTraverseNavigation()).toBe(true)

    history.pushState(null, '', '/project/default/editor')
    expect(isHistoryTraverseNavigation()).toBe(false)
  })

  test('keeps a popstate traverse across replaceState', () => {
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([])

    window.dispatchEvent(new PopStateEvent('popstate'))
    history.replaceState(null, '', '/project/default/editor?schema=public')

    expect(isHistoryTraverseNavigation()).toBe(true)
  })

  test('treats a document back-forward load as a traverse until the next push', () => {
    vi.spyOn(performance, 'getEntriesByType').mockImplementation((type) => {
      if (type !== 'navigation') return []
      return [{ type: 'back_forward' } as PerformanceNavigationTiming]
    })

    expect(isHistoryTraverseNavigation()).toBe(true)

    history.pushState(null, '', '/project/default/sql')
    expect(isHistoryTraverseNavigation()).toBe(false)
  })

  test('does not install again after pushState is replaced', () => {
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([])
    const addEventListener = vi.spyOn(window, 'addEventListener')
    const savedPushState = history.pushState.bind(history)
    history.pushState = (data, unused, url) => savedPushState(data, unused, url)

    isHistoryTraverseNavigation()
    installHistoryTraverseListener()

    const popstateListeners = addEventListener.mock.calls.filter(
      ([eventName]) => eventName === 'popstate'
    )
    expect(popstateListeners).toHaveLength(0)

    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(isHistoryTraverseNavigation()).toBe(true)

    history.pushState(null, '', '/project/default/editor')
    expect(isHistoryTraverseNavigation()).toBe(false)
  })

  test('does not treat a reload as a traverse', () => {
    vi.spyOn(performance, 'getEntriesByType').mockImplementation((type) => {
      if (type !== 'navigation') return []
      return [{ type: 'reload' } as PerformanceNavigationTiming]
    })

    expect(isHistoryTraverseNavigation()).toBe(false)
  })
})
