// @vitest-environment jsdom
import type { CaptureResult, PostHogConfig } from 'posthog-js'
import { describe, expect, it, vi } from 'vitest'

import { posthogClient } from './posthog-client'

const { init } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test'
  return { init: vi.fn() }
})

vi.mock('posthog-js', () => ({ default: { init, onFeatureFlags: vi.fn() } }))
// The real module reads window.matchMedia on import, which jsdom does not implement.
vi.mock('./helpers', () => ({ isBrowser: true }))

describe('posthogClient before_send', () => {
  it('redacts the keywords url param from properties the SDK fills in itself', () => {
    posthogClient.init()
    const { before_send } = init.mock.calls[0][1] as PostHogConfig
    const beforeSend = before_send as (event: CaptureResult | null) => CaptureResult | null
    const leakingUrl =
      'https://supabase.com/dashboard/project/abc/auth/users?keywords=person%40example.com'

    const sent = beforeSend({
      uuid: '1',
      event: '$set',
      properties: { $current_url: leakingUrl, $session_entry_url: leakingUrl },
      $set_once: { $initial_referrer: leakingUrl },
    })

    expect(JSON.stringify(sent)).not.toContain('person')
    expect(sent?.properties.$session_entry_url).toBe(
      'https://supabase.com/dashboard/project/abc/auth/users?keywords=redacted'
    )
  })
})
