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
