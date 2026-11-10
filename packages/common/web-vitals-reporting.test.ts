// @vitest-environment jsdom
/// <reference types="vitest/jsdom" />
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const METRIC_NAMES = ['LCP', 'CLS', 'INP', 'TTFB', 'FCP'] as const

const { sendTelemetryEvent, observers } = vi.hoisted(() => ({
  sendTelemetryEvent: vi.fn(),
  observers: {
    LCP: vi.fn(),
    CLS: vi.fn(),
    INP: vi.fn(),
    TTFB: vi.fn(),
    FCP: vi.fn(),
  },
}))

vi.mock('./telemetry', () => ({ sendTelemetryEvent }))
vi.mock('web-vitals', () => ({
  onLCP: observers.LCP,
  onCLS: observers.CLS,
  onINP: observers.INP,
  onTTFB: observers.TTFB,
  onFCP: observers.FCP,
}))

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)

const API_URL = 'https://api.example.com'

type HookProps = { apiUrl: string; enabled: boolean }

async function setup() {
  // The hook registers observers once per module instance, so each test needs a fresh one
  vi.resetModules()
  const { useWebVitalsReporting } = await import('./web-vitals-reporting')

  const Harness = (props: HookProps) => {
    useWebVitalsReporting(props)
    return null
  }

  let root = createRoot(document.createElement('div'))

  return {
    render: (props: HookProps) => act(async () => root.render(createElement(Harness, props))),
    // Unmounts the tree and mounts a fresh one, as when Telemetry remounts
    remount: (props: HookProps) =>
      act(async () => {
        root.unmount()
        root = createRoot(document.createElement('div'))
        root.render(createElement(Harness, props))
      }),
  }
}

const registrationCount = (name: (typeof METRIC_NAMES)[number]) => observers[name].mock.calls.length

describe('useWebVitalsReporting', () => {
  beforeEach(() => {
    sendTelemetryEvent.mockClear()
    Object.values(observers).forEach((observer) => observer.mockClear())
    window.history.pushState({}, '', '/project/abc/editor')
  })

  it('observes nothing until enabled', async () => {
    const { render } = await setup()

    await render({ apiUrl: API_URL, enabled: false })

    METRIC_NAMES.forEach((name) => expect(registrationCount(name)).toBe(0))
  })

  it('registers all five metrics once enabled, e.g. after consent is granted', async () => {
    const { render } = await setup()

    await render({ apiUrl: API_URL, enabled: false })
    await render({ apiUrl: API_URL, enabled: true })

    await vi.waitFor(() => {
      METRIC_NAMES.forEach((name) => expect(registrationCount(name)).toBe(1))
    })
  })

  it('does not stack observers across re-renders or remounts', async () => {
    const { render, remount } = await setup()

    await render({ apiUrl: API_URL, enabled: true })
    await vi.waitFor(() => expect(registrationCount('LCP')).toBe(1))

    await render({ apiUrl: API_URL, enabled: true })
    await render({ apiUrl: API_URL, enabled: false })
    await render({ apiUrl: API_URL, enabled: true })
    await remount({ apiUrl: API_URL, enabled: true })

    METRIC_NAMES.forEach((name) => expect(registrationCount(name)).toBe(1))
  })

  it('reports a metric as a web_vital_reported event for the landing page', async () => {
    const { render } = await setup()
    await render({ apiUrl: API_URL, enabled: true })
    await vi.waitFor(() => expect(registrationCount('INP')).toBe(1))

    // The page has moved on by the time INP is finalized
    window.history.pushState({}, '', '/org/acme')
    observers.INP.mock.calls[0][0]({
      name: 'INP',
      value: 312,
      rating: 'needs-improvement',
      id: 'v6-42',
      navigationType: 'reload',
    })

    expect(sendTelemetryEvent).toHaveBeenCalledTimes(1)
    expect(sendTelemetryEvent).toHaveBeenCalledWith(
      API_URL,
      {
        action: 'web_vital_reported',
        properties: {
          metricName: 'INP',
          metricValue: 312,
          metricRating: 'needs-improvement',
          metricId: 'v6-42',
          navigationType: 'reload',
        },
      },
      '/project/abc/editor'
    )
  })
})
