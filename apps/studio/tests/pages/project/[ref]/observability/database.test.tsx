import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import {
  useDatabaseChartDeepLink,
  useDatabaseSelectionFromUrl,
} from '@/pages/project/[ref]/observability/database'

class MockResizeObserver implements ResizeObserver {
  static instances: MockResizeObserver[] = []

  callback: ResizeObserverCallback
  disconnect = vi.fn()
  observe = vi.fn()
  takeRecords = vi.fn(() => [])
  unobserve = vi.fn()

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    MockResizeObserver.instances.push(this)
  }
}

class MockMutationObserver implements MutationObserver {
  static instances: MockMutationObserver[] = []

  callback: MutationCallback
  isDisconnected = false
  disconnect = vi.fn(() => {
    this.isDisconnected = true
  })
  observe = vi.fn()
  takeRecords = vi.fn(() => [])

  constructor(callback: MutationCallback) {
    this.callback = callback
    MockMutationObserver.instances.push(this)
  }

  notify() {
    if (!this.isDisconnected) this.callback([], this)
  }
}

const bounds = (top: number, bottom: number): DOMRect =>
  ({
    bottom,
    height: bottom - top,
    left: 0,
    right: 800,
    top,
    width: 800,
    x: 0,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect

const addChart = (id: string) => {
  const target = document.createElement('div')
  target.id = id
  target.scrollIntoView = vi.fn()
  document.querySelector('section')?.appendChild(target)
  return target
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('MutationObserver', MockMutationObserver)
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
  MockMutationObserver.instances = []
  MockResizeObserver.instances = []

  const scrollContainer = document.createElement('main')
  const chartList = document.createElement('section')
  vi.spyOn(scrollContainer, 'getBoundingClientRect').mockReturnValue(bounds(50, 800))
  scrollContainer.appendChild(chartList)
  document.body.appendChild(scrollContainer)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('useDatabaseChartDeepLink', () => {
  test('re-centers a chart when lazy loading pushes it outside the report viewport', () => {
    const target = addChart('disk-size')
    const targetBounds = vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(bounds(300, 600))

    const { unmount } = renderHook(() => useDatabaseChartDeepLink('disk-size'))

    act(() => vi.advanceTimersByTime(200))
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })

    act(() => MockResizeObserver.instances[0].callback([], MockResizeObserver.instances[0]))
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1)

    targetBounds.mockReturnValue(bounds(850, 1_150))
    act(() => MockResizeObserver.instances[0].callback([], MockResizeObserver.instances[0]))
    expect(target.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'auto', block: 'center' })

    unmount()
    expect(MockResizeObserver.instances[0].disconnect).toHaveBeenCalled()
  })

  test('stops re-centering after the user interacts with the page', () => {
    const target = addChart('disk-size')
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(bounds(300, 600))

    renderHook(() => useDatabaseChartDeepLink('disk-size'))

    act(() => vi.advanceTimersByTime(200))
    act(() => window.dispatchEvent(new Event('wheel')))

    expect(MockResizeObserver.instances[0].disconnect).toHaveBeenCalled()
  })

  test('stops waiting after the user interacts before the chart mounts', () => {
    renderHook(() => useDatabaseChartDeepLink('disk-size'))

    act(() => window.dispatchEvent(new Event('wheel')))
    const target = addChart('disk-size')
    act(() => MockMutationObserver.instances[0].notify())

    expect(target.scrollIntoView).not.toHaveBeenCalled()
    expect(MockResizeObserver.instances).toHaveLength(0)
  })

  test('scrolls when a conditional chart mounts after the previous polling window', () => {
    renderHook(() => useDatabaseChartDeepLink('disk-io-burst-balance'))

    act(() => vi.advanceTimersByTime(6_000))
    const target = addChart('disk-io-burst-balance')
    act(() => MockMutationObserver.instances[0].notify())

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    expect(MockMutationObserver.instances[0].disconnect).toHaveBeenCalled()
    expect(MockResizeObserver.instances[0].observe).toHaveBeenCalledWith(target.parentElement)
  })

  test('starts a fresh observer when the chart query parameter changes', () => {
    const cpuTarget = addChart('cpu-usage')
    const diskTarget = addChart('disk-size')
    vi.spyOn(cpuTarget, 'getBoundingClientRect').mockReturnValue(bounds(200, 500))
    vi.spyOn(diskTarget, 'getBoundingClientRect').mockReturnValue(bounds(300, 600))

    const { rerender } = renderHook(({ chart }) => useDatabaseChartDeepLink(chart), {
      initialProps: { chart: 'cpu-usage' },
    })

    act(() => vi.advanceTimersByTime(200))
    rerender({ chart: 'disk-size' })
    act(() => vi.advanceTimersByTime(200))

    expect(cpuTarget.scrollIntoView).toHaveBeenCalledTimes(1)
    expect(diskTarget.scrollIntoView).toHaveBeenCalledTimes(1)
    expect(MockResizeObserver.instances[0].disconnect).toHaveBeenCalled()
    expect(MockResizeObserver.instances[1].observe).toHaveBeenCalledWith(diskTarget.parentElement)
  })
})

describe('useDatabaseSelectionFromUrl', () => {
  test('selects the primary database when a deep link updates the database parameter', () => {
    const setSelectedDatabaseId = vi.fn()
    const { rerender } = renderHook(
      ({ db }) => useDatabaseSelectionFromUrl(db, setSelectedDatabaseId),
      { initialProps: { db: 'read-replica' } }
    )

    act(() => vi.advanceTimersByTime(100))
    expect(setSelectedDatabaseId).toHaveBeenLastCalledWith('read-replica')

    rerender({ db: 'project-ref' })
    act(() => vi.advanceTimersByTime(100))
    expect(setSelectedDatabaseId).toHaveBeenLastCalledWith('project-ref')
  })
})
