import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterContextProvider,
} from '@tanstack/react-router'
import { act, renderHook, waitFor } from '@testing-library/react'
import { consentState, sendTelemetryEvent } from 'common'
import { HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { createRequestTimingCollector } from './request-timing-collector'
import { useRouteRequestTelemetry } from './use-route-request-telemetry'
import { API_URL } from '@/lib/constants'
import { addAPIMock } from '@/tests/lib/msw'

interface SentEvent {
  action: string
  pathname: string
  custom_properties: Record<string, unknown>
}

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
  renderHook(() => useRouteRequestTelemetry({ apiUrl: API_URL, collector }), {
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

// Events as they reach the network, through the real consent gate and transport
let sentEvents: SentEvent[]

const sentSummaries = () =>
  sentEvents.filter((event) => event.action === 'route_requests_evaluated')

const waitForSummaries = (count: number) =>
  waitFor(() => expect(sentSummaries().length).toBeGreaterThanOrEqual(count))

// Requests reach the network in the order they were sent, so once this unrelated event has
// arrived, anything sent before it has too. Lets a test check that nothing was sent.
const waitForTransportToFlush = async () => {
  sendTelemetryEvent(API_URL, {
    action: 'sign_in_button_clicked',
    properties: { buttonLocation: 'test' },
  })
  await waitFor(() =>
    expect(sentEvents.some((event) => event.action === 'sign_in_button_clicked')).toBe(true)
  )
}

beforeEach(async () => {
  sentEvents = []
  addAPIMock({
    method: 'post',
    path: '/platform/telemetry/event',
    response: async ({ request }) => {
      sentEvents.push((await request.json()) as SentEvent)
      return HttpResponse.json({})
    },
  })
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })

  router = createTestRouter(PROJECT)
  await router.load()
  collector = createRequestTimingCollector({ isSampled: true, sampleRate: 1 })
})

describe('route visits', () => {
  it('sends the initial visit as a summary once the route changes', async () => {
    await setConsent('accepted')
    renderTelemetryHook()
    loadRequest()

    await navigate(`${PROJECT}/editor`)
    await waitForSummaries(1)

    expect(sentSummaries()).toHaveLength(1)
    // The route template is the pathname, so the event never carries the project ref there
    expect(sentSummaries()[0]).toMatchObject({
      action: 'route_requests_evaluated',
      pathname: '/project/[ref]',
      custom_properties: {
        routeTemplate: '/project/[ref]',
        isInitialLoad: true,
        requestCount: 1,
      },
    })
  })

  it('attributes the next visit to the route that was navigated to', async () => {
    await setConsent('accepted')
    renderTelemetryHook()

    await navigate(`${PROJECT}/editor`)
    loadRequest()
    await navigate('/org/acme')
    await waitForSummaries(2)

    expect(sentSummaries()[1].custom_properties).toMatchObject({
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
    await waitForTransportToFlush()

    expect(sentSummaries()).toHaveLength(1)
    expect(sentSummaries()[0].custom_properties).toMatchObject({ requestCount: 2 })
  })

  it('starts a new visit when only the project in the path changes', async () => {
    await setConsent('accepted')
    renderTelemetryHook()

    await navigate('/project/zyxwvutsrqponmlkjihg')
    await waitForSummaries(1)

    expect(sentSummaries()).toHaveLength(1)
  })

  it('sends the visit when the tab is hidden, and not again for the empty visit after it', async () => {
    await setConsent('accepted')
    renderTelemetryHook()
    loadRequest()

    hideTab()
    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })
    await waitForTransportToFlush()

    expect(sentSummaries()).toHaveLength(1)
    expect(sentSummaries()[0].custom_properties).toMatchObject({
      routeTemplate: '/project/[ref]',
      requestCount: 1,
    })
  })
})

describe('consent', () => {
  it('holds a finished visit while the user has not decided, then sends it once they accept', async () => {
    await setConsent('undecided')
    renderTelemetryHook()
    loadRequest()

    await navigate('/org/acme')
    await setConsent('accepted')
    await waitForSummaries(1)

    expect(sentSummaries()).toHaveLength(1)
    expect(sentSummaries()[0].custom_properties).toMatchObject({
      isInitialLoad: true,
      requestCount: 1,
    })
  })

  it('never sends a visit that finished before the user denied consent', async () => {
    await setConsent('undecided')
    renderTelemetryHook()
    loadRequest()
    await navigate('/org/acme')

    await setConsent('denied')
    await setConsent('accepted')
    // The next visit is reported, so anything held from before would arrive ahead of it
    loadRequest()
    await navigate(`${PROJECT}/editor`)
    await waitForSummaries(1)
    await waitForTransportToFlush()

    expect(sentSummaries()).toHaveLength(1)
    expect(sentSummaries()[0].custom_properties).toMatchObject({
      routeTemplate: '/org/[slug]',
      isInitialLoad: false,
    })
  })

  it('discards what the current visit had recorded when consent is denied', async () => {
    await setConsent('undecided')
    renderTelemetryHook()
    loadRequest()

    await setConsent('denied')
    await setConsent('accepted')
    await navigate('/org/acme')
    await waitForSummaries(1)

    expect(sentSummaries()[0].custom_properties).toMatchObject({
      routeTemplate: '/project/[ref]',
      requestCount: 0,
    })
  })

  it('does not keep a visit that finished while consent was denied', async () => {
    await setConsent('denied')
    renderTelemetryHook()
    loadRequest()
    await navigate('/org/acme')

    await setConsent('accepted')
    loadRequest()
    await navigate(`${PROJECT}/editor`)
    await waitForSummaries(1)
    await waitForTransportToFlush()

    expect(sentSummaries()).toHaveLength(1)
    expect(sentSummaries()[0].custom_properties).toMatchObject({ routeTemplate: '/org/[slug]' })
  })
})

describe('page loads that are not reported', () => {
  it('sends nothing for a page load that was not sampled', async () => {
    collector = createRequestTimingCollector({ isSampled: false, sampleRate: 0.1 })
    await setConsent('accepted')
    renderTelemetryHook()
    loadRequest()

    await navigate('/org/acme')
    hideTab()
    await waitForTransportToFlush()

    expect(sentSummaries()).toHaveLength(0)
  })
})
