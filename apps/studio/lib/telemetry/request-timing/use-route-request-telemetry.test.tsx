import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterContextProvider,
} from '@tanstack/react-router'
import { act, renderHook } from '@testing-library/react'
import { consentState } from 'common'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createRequestTimingCollector } from './request-timing-collector'
import { useRouteRequestTelemetry } from './use-route-request-telemetry'

const { sendTelemetryEvent, harness } = vi.hoisted(() => ({
  sendTelemetryEvent: vi.fn(),
  harness: { collector: undefined as unknown },
}))

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  sendTelemetryEvent,
}))
vi.mock('@/lib/telemetry/request-timing/request-timing-collector', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./request-timing-collector')>()),
  get requestTimingCollector() {
    return harness.collector
  },
}))

const API_URL = 'https://api.example.com'
const PROJECT = '/project/abcdefghijklmnopqrst'

// Mirrors how Studio's routes are laid out, including a pathless layout route
function createTestRouter(initialPath: string) {
  const root = createRootRoute()
  const app = createRoute({ getParentRoute: () => root, id: '_app' })
  const routeTree = root.addChildren([
    app.addChildren([
      createRoute({ getParentRoute: () => app, path: '/project/$ref/' }),
      createRoute({ getParentRoute: () => app, path: '/project/$ref/editor' }),
      createRoute({ getParentRoute: () => app, path: '/org/$slug' }),
    ]),
  ])
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

let router: ReturnType<typeof createTestRouter>
let collector: ReturnType<typeof createRequestTimingCollector>

const renderTelemetryHook = () =>
  renderHook(() => useRouteRequestTelemetry({ apiUrl: API_URL }), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <RouterContextProvider router={router}>{children}</RouterContextProvider>
    ),
  })

const setConsent = (state: 'accepted' | 'undecided' | 'denied') =>
  // Async so the store's batched notification reaches React inside act
  act(async () => {
    Object.assign(consentState, {
      // The consent SDK has finished loading in every state; "undecided" means the banner is up
      isResolved: true,
      hasConsented: state === 'accepted',
      showConsentToast: state === 'undecided',
    })
  })

// The router is provided as context only, so nothing reacts to history changes on its own
const navigate = (path: string) =>
  act(async () => {
    router.history.push(path)
    await router.load()
  })

const hideTab = () =>
  act(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })

const loadRequest = () =>
  collector.recordRequest({ endpoint: 'GET /a', startMs: 0, endMs: 10, isError: false })

const sentSummaries = () => sendTelemetryEvent.mock.calls.map(([, event]) => event.properties)

beforeEach(async () => {
  sendTelemetryEvent.mockClear()
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })

  router = createTestRouter(PROJECT)
  await router.load()
  collector = createRequestTimingCollector({ isSampled: true, sampleRate: 1 })
  harness.collector = collector
})

describe('route visits', () => {
  it('sends the initial visit as a summary once the route changes', async () => {
    await setConsent('accepted')
    renderTelemetryHook()
    loadRequest()

    await navigate(`${PROJECT}/editor`)

    expect(sendTelemetryEvent).toHaveBeenCalledTimes(1)
    expect(sendTelemetryEvent).toHaveBeenCalledWith(
      API_URL,
      {
        action: 'route_requests_evaluated',
        properties: expect.objectContaining({
          routeTemplate: '/project/[ref]',
          isInitialLoad: true,
          requestCount: 1,
        }),
      },
      '/project/[ref]'
    )
  })

  it('attributes the next visit to the route that was navigated to', async () => {
    await setConsent('accepted')
    renderTelemetryHook()

    await navigate(`${PROJECT}/editor`)
    loadRequest()
    await navigate('/org/acme')

    expect(sentSummaries()[1]).toMatchObject({
      routeTemplate: '/project/[ref]/editor',
      isInitialLoad: false,
      requestCount: 1,
    })
  })

  it('treats a change that only touches the query string, such as a filter, as the same visit', async () => {
    await setConsent('accepted')
    renderTelemetryHook()
    loadRequest()

    await navigate(`${PROJECT}?filter=a`)
    loadRequest()
    await navigate('/org/acme')

    expect(sendTelemetryEvent).toHaveBeenCalledTimes(1)
    expect(sentSummaries()[0]).toMatchObject({ requestCount: 2 })
  })

  it('starts a new visit when only the project in the path changes', async () => {
    await setConsent('accepted')
    renderTelemetryHook()

    await navigate('/project/zyxwvutsrqponmlkjihg')

    expect(sendTelemetryEvent).toHaveBeenCalledTimes(1)
  })

  it('sends the visit when the tab is hidden, and not again for the empty visit after it', async () => {
    await setConsent('accepted')
    renderTelemetryHook()
    loadRequest()

    hideTab()
    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })

    expect(sendTelemetryEvent).toHaveBeenCalledTimes(1)
    expect(sentSummaries()[0]).toMatchObject({ routeTemplate: '/project/[ref]', requestCount: 1 })
  })
})

describe('consent', () => {
  it('holds a finished visit while the user has not decided, then sends it once they accept', async () => {
    await setConsent('undecided')
    renderTelemetryHook()
    loadRequest()

    await navigate('/org/acme')
    expect(sendTelemetryEvent).not.toHaveBeenCalled()

    await setConsent('accepted')

    expect(sendTelemetryEvent).toHaveBeenCalledTimes(1)
    expect(sentSummaries()[0]).toMatchObject({ isInitialLoad: true, requestCount: 1 })
  })

  it('never sends a visit that finished before the user denied consent', async () => {
    await setConsent('undecided')
    renderTelemetryHook()
    loadRequest()
    await navigate('/org/acme')

    await setConsent('denied')
    await setConsent('accepted')

    expect(sendTelemetryEvent).not.toHaveBeenCalled()
  })

  it('discards what the current visit had recorded when consent is denied', async () => {
    await setConsent('undecided')
    renderTelemetryHook()
    loadRequest()

    await setConsent('denied')
    await setConsent('accepted')
    await navigate('/org/acme')

    expect(sentSummaries()[0]).toMatchObject({ requestCount: 0 })
  })

  it('sends nothing while consent is denied', async () => {
    await setConsent('denied')
    renderTelemetryHook()
    loadRequest()

    await navigate('/org/acme')

    expect(sendTelemetryEvent).not.toHaveBeenCalled()
  })
})

describe('page loads that are not reported', () => {
  it('sends nothing for a page load that was not sampled', async () => {
    collector = createRequestTimingCollector({ isSampled: false, sampleRate: 0.1 })
    harness.collector = collector
    await setConsent('accepted')
    renderTelemetryHook()
    loadRequest()

    await navigate('/org/acme')
    hideTab()

    expect(sendTelemetryEvent).not.toHaveBeenCalled()
  })
})
