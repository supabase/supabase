import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  installHistoryTraverseListener,
  isHistoryTraverseNavigation,
  markHistoryTraverseShellReady,
  resetHistoryTraverseState,
  scheduleHistoryTraverseSettlement,
  settleHistoryTraverseNavigation,
} from './history-traverse'

const mockNavigationType = (type?: PerformanceNavigationTiming['type']) => {
  vi.spyOn(performance, 'getEntriesByType').mockImplementation((entryType) => {
    if (entryType !== 'navigation' || type === undefined) return []
    return [{ type } as PerformanceNavigationTiming]
  })
}

describe('isHistoryTraverseNavigation', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetHistoryTraverseState()
  })

  test('is false for a fresh document navigation', () => {
    mockNavigationType('navigate')

    expect(isHistoryTraverseNavigation()).toBe(false)
  })

  test('is true after a popstate and false again after a push', () => {
    mockNavigationType()

    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(isHistoryTraverseNavigation()).toBe(true)

    history.pushState(null, '', '/project/default/editor')
    expect(isHistoryTraverseNavigation()).toBe(false)
  })

  test('keeps a popstate traverse across replaceState', () => {
    mockNavigationType()

    window.dispatchEvent(new PopStateEvent('popstate'))
    history.replaceState(null, '', '/project/default/editor?schema=public')

    expect(isHistoryTraverseNavigation()).toBe(true)
  })

  test('clears a popstate once the navigation settles, including after replaceState', () => {
    mockNavigationType()

    window.dispatchEvent(new PopStateEvent('popstate'))
    history.replaceState(null, '', '/project/default/editor?schema=public')
    expect(isHistoryTraverseNavigation()).toBe(true)

    settleHistoryTraverseNavigation()
    expect(isHistoryTraverseNavigation()).toBe(false)
  })

  test('ignores a scheduled settle until the shell has rendered', () => {
    mockNavigationType('navigate')

    window.dispatchEvent(new PopStateEvent('popstate'))
    scheduleHistoryTraverseSettlement()
    expect(isHistoryTraverseNavigation()).toBe(true)

    markHistoryTraverseShellReady()
    expect(isHistoryTraverseNavigation()).toBe(false)
  })

  test('keeps a back-forward document load after settle until the next push', () => {
    mockNavigationType('back_forward')

    expect(isHistoryTraverseNavigation()).toBe(true)

    settleHistoryTraverseNavigation()
    expect(isHistoryTraverseNavigation()).toBe(true)

    history.pushState(null, '', '/project/default/sql')
    expect(isHistoryTraverseNavigation()).toBe(false)
  })

  test('treats a document back-forward load as a traverse until the next push', () => {
    mockNavigationType('back_forward')

    expect(isHistoryTraverseNavigation()).toBe(true)

    history.pushState(null, '', '/project/default/sql')
    expect(isHistoryTraverseNavigation()).toBe(false)
  })

  test('does not install again after pushState is replaced', () => {
    mockNavigationType()
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
    mockNavigationType('reload')

    expect(isHistoryTraverseNavigation()).toBe(false)
  })
})
