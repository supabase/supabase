// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  window.matchMedia = (() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
})

const posthog = vi.hoisted(() => ({
  init: vi.fn(),
  reset: vi.fn(),
  identify: vi.fn(),
  onFeatureFlags: vi.fn(),
  opt_out_capturing: vi.fn(),
  opt_in_capturing: vi.fn(),
  has_opted_out_capturing: vi.fn(() => false),
  get_session_id: vi.fn(),
  onSessionId: vi.fn(),
}))

vi.mock('posthog-js', () => ({ default: posthog }))

const loadClient = async () => {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'phc_test')
  const { posthogClient } = await import('./posthog-client')
  return posthogClient
}

const initConfig = () => posthog.init.mock.calls[0][1]

describe('PostHogClient consent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    posthog.has_opted_out_capturing.mockReturnValue(false)
  })

  it('disables PostHog persistence while opted out', async () => {
    const client = await loadClient()
    client.init()

    expect(initConfig()).toMatchObject({ opt_out_persistence_by_default: true })
  })

  it('optOut resets the identity, then opts out', async () => {
    const client = await loadClient()
    client.init()

    client.optOut()

    expect(posthog.reset).toHaveBeenCalledOnce()
    expect(posthog.opt_out_capturing).toHaveBeenCalledOnce()
    expect(posthog.reset.mock.invocationCallOrder[0]).toBeLessThan(
      posthog.opt_out_capturing.mock.invocationCallOrder[0]
    )
  })

  it('keeps the opt-out through a later reset, such as sign-out', async () => {
    const client = await loadClient()
    client.init()
    client.optOut()
    posthog.opt_out_capturing.mockClear()

    client.reset()

    expect(posthog.opt_out_capturing).toHaveBeenCalledOnce()
  })

  it('keeps an opt-out stored by another tab through a reset', async () => {
    const client = await loadClient()
    client.init()
    posthog.has_opted_out_capturing.mockReturnValue(true)

    client.reset()

    expect(posthog.reset.mock.invocationCallOrder[0]).toBeLessThan(
      posthog.opt_out_capturing.mock.invocationCallOrder[0]
    )
  })

  it('stops re-applying the opt-out after opting back in', async () => {
    const client = await loadClient()
    client.init()
    client.optOut()
    client.optIn()
    posthog.opt_out_capturing.mockClear()

    client.reset()

    expect(posthog.opt_out_capturing).not.toHaveBeenCalled()
  })

  it('stops writing the session_id cookie once opted out', async () => {
    const client = await loadClient()
    client.init()
    initConfig().loaded(posthog)
    const onSessionChange = posthog.onSessionId.mock.calls[0][0]

    onSessionChange('session-before-opt-out')
    client.optOut()
    onSessionChange('session-after-opt-out')

    expect(document.cookie).toContain('session_id=session-before-opt-out')
  })

  it('stops writing the session_id cookie after an opt-out stored by another tab', async () => {
    const client = await loadClient()
    client.init()
    initConfig().loaded(posthog)
    const onSessionChange = posthog.onSessionId.mock.calls[0][0]

    onSessionChange('session-before-other-tab')
    posthog.has_opted_out_capturing.mockReturnValue(true)
    onSessionChange('session-after-other-tab')

    expect(document.cookie).toContain('session_id=session-before-other-tab')
  })

  it('opts in before flushing calls queued from an earlier opted-out session', async () => {
    const client = await loadClient()
    posthog.has_opted_out_capturing.mockReturnValue(true)
    client.identify('user-1', { org_count: 1 })
    client.init()

    initConfig().loaded(posthog)

    expect(posthog.opt_in_capturing).toHaveBeenCalledWith({ captureEventName: false })
    expect(posthog.opt_in_capturing.mock.invocationCallOrder[0]).toBeLessThan(
      posthog.identify.mock.invocationCallOrder[0]
    )
  })
})

describe('PostHogClient before_send', () => {
  it('redacts url params and the hash from properties the SDK fills in itself', async () => {
    vi.clearAllMocks()
    const client = await loadClient()
    client.init()
    const projectPage = 'https://supabase.com/dashboard/project/abc'
    const leakingUrl = `${projectPage}?token=secret1&utm_source=docs#access_token=secret2&refresh_token=secret3`
    const redactedUrl = `${projectPage}?token=redacted&utm_source=docs`

    const sent = initConfig().before_send({
      event: '$identify',
      properties: {
        $current_url: leakingUrl,
        $referrer: leakingUrl,
        $initial_referrer: leakingUrl,
        $session_entry_url: leakingUrl,
        $set: { $current_url: leakingUrl },
        $set_once: { $initial_current_url: leakingUrl },
      },
      $set: { $current_url: leakingUrl },
      $set_once: { $initial_current_url: leakingUrl },
    })

    expect(JSON.stringify(sent)).not.toMatch(/secret|#/)
    expect(sent.properties.$session_entry_url).toBe(redactedUrl)
    expect(sent.$set_once.$initial_current_url).toBe(redactedUrl)
  })

  it('replaces the title the SDK stamps on a pageview, and leaves other events alone', async () => {
    vi.clearAllMocks()
    const client = await loadClient()
    client.init()
    const { setTelemetryPageTitleResolver } = await import('./telemetry-utils')
    setTelemetryPageTitleResolver(() => 'Tables | Supabase')
    const fullTitle = 'users | Tables | Acme Project | Acme Org | Supabase'

    const pageview = initConfig().before_send({
      event: '$pageview',
      properties: { title: fullTitle },
    })
    const custom = initConfig().before_send({
      event: 'finding_viewed',
      properties: { title: 'Custom' },
    })

    expect(pageview.properties.title).toBe('Tables | Supabase')
    expect(custom.properties.title).toBe('Custom')
  })
})
