import type { AnyRouter } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sentryMocks = vi.hoisted(() => ({
  init: vi.fn(),
  tanstackRouterBrowserTracingIntegration: vi.fn(() => ({
    name: 'TanStackRouterBrowserTracing',
  })),
  // Imported at module scope by lib/sentry-client-options.ts, so the mock
  // must provide it even though the TanStack init never enables it.
  thirdPartyErrorFilterIntegration: vi.fn(() => ({ name: 'ThirdPartyErrorsFilter' })),
}))

vi.mock('@sentry/react', () => sentryMocks)

// The integration only needs a router reference to hook navigation events, and
// it is mocked here — a stub stands in for the real router at this boundary.
const fakeRouter = { subscribe: vi.fn() } as unknown as AnyRouter

// sentry.tanstack.ts keeps a module-level `initialized` flag, so each test
// imports a fresh copy of the module.
async function loadInitializer() {
  vi.resetModules()
  const { initSentryTanStackClient } = await import('./sentry.tanstack')
  return initSentryTanStackClient
}

describe('initSentryTanStackClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('does not initialize Sentry during SSR/prerender (no window)', async () => {
    const initSentryTanStackClient = await loadInitializer()
    vi.stubGlobal('window', undefined)

    initSentryTanStackClient(fakeRouter)

    expect(sentryMocks.init).not.toHaveBeenCalled()
  })

  it('initializes Sentry in the browser with the shared client options', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://public@sentry.example.com/1')
    const initSentryTanStackClient = await loadInitializer()

    initSentryTanStackClient(fakeRouter)

    expect(sentryMocks.init).toHaveBeenCalledTimes(1)
    expect(sentryMocks.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://public@sentry.example.com/1',
        tracesSampleRate: 0.02,
      })
    )
  })

  it('passes an undefined dsn when NEXT_PUBLIC_SENTRY_DSN is unset (disabled-client no-op)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', undefined)
    const initSentryTanStackClient = await loadInitializer()

    initSentryTanStackClient(fakeRouter)

    // `Sentry.init` without a dsn creates a disabled client, so calling init
    // unconditionally is safe for local/self-hosted builds.
    expect(sentryMocks.init).toHaveBeenCalledTimes(1)
    expect(sentryMocks.init).toHaveBeenCalledWith(expect.objectContaining({ dsn: undefined }))
  })

  it('only initializes once across repeated calls', async () => {
    const initSentryTanStackClient = await loadInitializer()

    initSentryTanStackClient(fakeRouter)
    initSentryTanStackClient(fakeRouter)

    expect(sentryMocks.init).toHaveBeenCalledTimes(1)
  })

  it('still initializes in the browser after an earlier SSR call', async () => {
    const initSentryTanStackClient = await loadInitializer()

    // An SSR call must not trip the idempotency guard for the browser call.
    vi.stubGlobal('window', undefined)
    initSentryTanStackClient(fakeRouter)
    expect(sentryMocks.init).not.toHaveBeenCalled()

    vi.unstubAllGlobals()
    initSentryTanStackClient(fakeRouter)
    expect(sentryMocks.init).toHaveBeenCalledTimes(1)
  })

  it('wires the TanStack Router browser tracing integration for the given router', async () => {
    const initSentryTanStackClient = await loadInitializer()

    initSentryTanStackClient(fakeRouter)

    expect(sentryMocks.tanstackRouterBrowserTracingIntegration).toHaveBeenCalledWith(fakeRouter)

    const [options] = sentryMocks.init.mock.calls[0]
    // `integrations` is the function form: Sentry.init calls it with the
    // default integrations (browserSession, globalHandlers, …) and installs
    // whatever it returns, so the defaults must survive the merge.
    expect(options.integrations).toBeTypeOf('function')
    const defaultIntegrations = [{ name: 'BrowserSession' }, { name: 'GlobalHandlers' }]
    const integrations = options.integrations(defaultIntegrations)

    // Defaults passed in by Sentry.init survive the merge.
    expect(integrations).toContainEqual({ name: 'BrowserSession' })
    expect(integrations).toContainEqual({ name: 'GlobalHandlers' })
    expect(integrations).toContainEqual({ name: 'TanStackRouterBrowserTracing' })
    // The Vite build runs no Sentry bundler plugin, so frames carry no
    // applicationKey metadata — the third-party filter must stay off or every
    // event would be tagged third_party_code=true and dropped by beforeSend.
    expect(sentryMocks.thirdPartyErrorFilterIntegration).not.toHaveBeenCalled()
    expect(integrations).not.toContainEqual({ name: 'ThirdPartyErrorsFilter' })
  })

  it('passes the Vercel commit SHA as the release so session envelopes are sent', async () => {
    // The SDK silently drops session envelopes when the client has no release
    // (`Client.sendSession` early-returns) — without this, Release Health
    // sends no /envelope traffic at all on the TanStack build. The Next build
    // instead gets its release injected at build time by withSentryConfig.
    vi.stubEnv('NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA', 'abc123commit')
    const initSentryTanStackClient = await loadInitializer()

    initSentryTanStackClient(fakeRouter)

    expect(sentryMocks.init).toHaveBeenCalledWith(
      expect.objectContaining({ release: 'abc123commit' })
    )
  })
})
