import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    group: vi.fn(),
    get_distinct_id: vi.fn().mockReturnValue('test-distinct-id'),
    get_session_id: vi.fn().mockReturnValue('test-session-id'),
  },
}))

vi.mock('@sentry/nextjs', () => ({
  withScope: vi.fn((cb: (scope: any) => void) => {
    const scope = { setTag: vi.fn() }
    cb(scope)
  }),
  captureException: vi.fn(),
}))

import posthog from 'posthog-js'
import * as Sentry from '@sentry/nextjs'
import { PostHogClient } from './posthog-client'

describe('PostHogClient — Sentry error reporting', () => {
  let client: PostHogClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new PostHogClient({ apiKey: 'test-key' })
    ;(client as any).initialized = true
    ;(client as any).initStarted = true
  })

  it('sends capturePageView errors to Sentry', () => {
    vi.mocked(posthog.capture).mockImplementation(() => {
      throw new Error('PostHog network failure')
    })
    client.capturePageView({ $current_url: 'https://example.com' })
    expect(Sentry.withScope).toHaveBeenCalled()
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'PostHog network failure' })
    )
  })

  it('sends capturePageLeave errors to Sentry', () => {
    vi.mocked(posthog.capture).mockImplementation(() => {
      throw new Error('PostHog pageleave failure')
    })
    client.capturePageLeave({ $current_url: 'https://example.com' })
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'PostHog pageleave failure' })
    )
  })

  it('sends identify errors to Sentry', () => {
    vi.mocked(posthog.identify).mockImplementation(() => {
      throw new Error('PostHog identify failure')
    })
    client.identify('user-123')
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'PostHog identify failure' })
    )
  })

  it('tags all telemetry errors with team: growth-eng', () => {
    vi.mocked(posthog.capture).mockImplementation(() => {
      throw new Error('any error')
    })
    client.capturePageView({})

    const scopeCallback = vi.mocked(Sentry.withScope).mock.calls[0][0]
    const mockScope = { setTag: vi.fn() }
    scopeCallback(mockScope)

    expect(mockScope.setTag).toHaveBeenCalledWith('team', 'growth-eng')
    expect(mockScope.setTag).toHaveBeenCalledWith('context', 'posthog-client')
  })
})
