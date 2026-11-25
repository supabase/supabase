// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

import {
  getSharedTelemetryData,
  redactEventUrlKeywords,
  redactUrlKeywords,
  setTelemetryPageTitleResolver,
} from './telemetry-utils'

// The real module reads window.matchMedia on import, which jsdom does not implement.
vi.mock('./helpers', () => ({ isBrowser: true }))

const PROJECT = 'https://supabase.com/dashboard/project/abc'
const USERS_PAGE = `${PROJECT}/auth/users`
const LEAKING_URL = `${USERS_PAGE}?keywords=person%40example.com`
const REDACTED_URL = `${USERS_PAGE}?keywords=redacted`
const PRICING_PAGE = 'https://supabase.com/pricing'

describe('url redaction', () => {
  it.each([
    [LEAKING_URL, REDACTED_URL],
    [
      `${PROJECT}/database/schemas?schema=billing_private`,
      `${PROJECT}/database/schemas?schema=redacted`,
    ],
    [
      `${PROJECT}/editor/1?filter=email%3Aeq%3Aperson%40example.com&sort=email%3Aasc`,
      `${PROJECT}/editor/1?filter=redacted&sort=redacted`,
    ],
    [`${PROJECT}/database/tables?search=person`, `${PROJECT}/database/tables?search=redacted`],
    [
      `${PROJECT}/logs/explorer?s=person&its=2026-01-01`,
      `${PROJECT}/logs/explorer?s=redacted&its=redacted`,
    ],
    [`${PROJECT}/editor/1?%66ilter=person`, `${PROJECT}/editor/1?%66ilter=redacted`],
    [
      'https://supabase.com/dashboard/join?token=secret&slug=acme',
      'https://supabase.com/dashboard/join?token=redacted&slug=redacted',
    ],
    ['/sign-in?returnTo=/join?token=secret', '/sign-in?returnTo=redacted'],
    [`${LEAKING_URL}#access_token=secret&refresh_token=secret`, REDACTED_URL],
    [`${PROJECT}#secret`, PROJECT],
    [
      '/project/abc#access_token=secret&refresh_token=secret',
      '/project/abc#access_token=redacted&refresh_token=redacted',
    ],
    [
      `${PRICING_PAGE}?utm_source=docs&utm_campaign=launch&gclid=abc&dub_id=xyz`,
      `${PRICING_PAGE}?utm_source=docs&utm_campaign=launch&gclid=abc&dub_id=xyz`,
    ],
    [
      `${PRICING_PAGE}?my_utm_source=person&utm_sources=person&UTM_SOURCE=person`,
      `${PRICING_PAGE}?my_utm_source=redacted&utm_sources=redacted&UTM_SOURCE=redacted`,
    ],
    ['https://example.com/', 'https://example.com/'],
    ['/project/[ref]/editor/[id]', '/project/[ref]/editor/[id]'],
    ['Issue #12', 'Issue #12'],
  ])('redactUrlKeywords(%j)', (url, expected) => {
    expect(redactUrlKeywords(url)).toBe(expected)
  })

  it('covers every property bag of an outgoing event and leaves non-strings alone', () => {
    const event = {
      properties: {
        $session_entry_url: LEAKING_URL,
        viewport_width: 1280,
        $set: { last_page: LEAKING_URL },
        $set_once: { $initial_referrer: LEAKING_URL },
      },
      $set: { last_page: LEAKING_URL },
      $set_once: { $initial_current_url: LEAKING_URL },
    }

    redactEventUrlKeywords(event)

    expect(event).toEqual({
      properties: {
        $session_entry_url: REDACTED_URL,
        viewport_width: 1280,
        $set: { last_page: REDACTED_URL },
        $set_once: { $initial_referrer: REDACTED_URL },
      },
      $set: { last_page: REDACTED_URL },
      $set_once: { $initial_current_url: REDACTED_URL },
    })
  })

  it('covers the page URL, query string, referrer, pathname and title in the shared telemetry data', () => {
    window.history.replaceState(
      {},
      '',
      '/project/abc/auth/users?keywords=person%40example.com#access_token=secret'
    )
    Object.defineProperty(document, 'referrer', { value: `${LEAKING_URL}&utm_source=docs` })
    document.title = 'users | Tables | Acme Project | Acme Org | Supabase'
    setTelemetryPageTitleResolver(() => 'Tables | Supabase')

    const data = getSharedTelemetryData(`${PRICING_PAGE}?q=person&utm_source=docs`)

    expect(data.page_url).toBe(`${window.location.origin}/project/abc/auth/users?keywords=redacted`)
    expect(data.ph.search).toBe('?keywords=redacted')
    expect(data.ph.referrer).toBe(`${REDACTED_URL}&utm_source=docs`)
    expect(data.pathname).toBe(`${PRICING_PAGE}?q=redacted&utm_source=docs`)
    expect(data.page_title).toBe('Tables | Supabase')
  })
})
