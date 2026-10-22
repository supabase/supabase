import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  installHistoryTraverseListener,
  isHistoryTraverseNavigation,
  markHistoryTraverseShellReady,
  scheduleHistoryTraverseSettlement,
  settleHistoryTraverseNavigation,
} from './history-traverse'
import { resetHistoryTraverseState } from '@/tests/lib/history-traverse-test-utils'

const mockNavigationType = (type?: PerformanceNavigationTiming['type'], name?: string) => {
  const documentUrl = name ?? window.location.href
  vi.spyOn(performance, 'getEntriesByType').mockImplementation((entryType) => {
    if (entryType !== 'navigation' || type === undefined) return []
    return [
      {
        name: documentUrl,
        entryType: 'navigation',
        startTime: 0,
        duration: 0,
        type,
        toJSON() {
          return {}
        },
      },
    ]
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

  test('keeps a document back-forward across reads until a push', () => {
    mockNavigationType('back_forward')

    settleHistoryTraverseNavigation()
    expect(isHistoryTraverseNavigation()).toBe(true)
    expect(isHistoryTraverseNavigation()).toBe(true)

    history.pushState(null, '', '/project/default/sql')
    expect(isHistoryTraverseNavigation()).toBe(false)
  })

  test('does not treat a document back-forward as a traverse after a push', () => {
    mockNavigationType('back_forward')

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

  test('stops treating a document back-forward as a traverse once replace leaves its url', () => {
    const documentUrl = window.location.href
    mockNavigationType('back_forward', documentUrl)

    history.replaceState(null, '', '/project/default/sql')
    expect(isHistoryTraverseNavigation()).toBe(false)

    history.replaceState(null, '', documentUrl)
    expect(isHistoryTraverseNavigation()).toBe(false)
  })

  test('settles a popstate as soon as the shell is ready, without a timer', () => {
    mockNavigationType('navigate')
    markHistoryTraverseShellReady()

    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(isHistoryTraverseNavigation()).toBe(true)

    scheduleHistoryTraverseSettlement()
    expect(isHistoryTraverseNavigation()).toBe(false)
  })
})
