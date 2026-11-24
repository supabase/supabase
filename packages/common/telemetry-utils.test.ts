// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

import {
  getSharedTelemetryData,
  redactEventUrlKeywords,
  redactUrlKeywords,
} from './telemetry-utils'

// The real module reads window.matchMedia on import, which jsdom does not implement.
vi.mock('./helpers', () => ({ isBrowser: true }))

const USERS_PAGE = 'https://supabase.com/dashboard/project/abc/auth/users'
const LEAKING_URL = `${USERS_PAGE}?keywords=person%40example.com`
const REDACTED_URL = `${USERS_PAGE}?keywords=redacted`

describe('keywords url param redaction', () => {
  it.each([
    [LEAKING_URL, REDACTED_URL],
    [
      `${USERS_PAGE}?sortBy=id&keywords=jane+doe#row`,
      `${USERS_PAGE}?sortBy=id&keywords=redacted#row`,
    ],
    [`${USERS_PAGE}?mykeywords=abc`, `${USERS_PAGE}?mykeywords=abc`],
    [
      'https://supabase.com/dashboard/project/abc/database/schemas?schema=billing_private',
      'https://supabase.com/dashboard/project/abc/database/schemas?schema=redacted',
    ],
    [
      'https://supabase.com/dashboard/project/abc/editor/1?schema=acme&view=definition',
      'https://supabase.com/dashboard/project/abc/editor/1?schema=redacted&view=definition',
    ],
    [
      'https://supabase.com/dashboard/project/abc/database/tables?schemas=a&myschema=b',
      'https://supabase.com/dashboard/project/abc/database/tables?schemas=a&myschema=b',
    ],
    ['https://example.com/', 'https://example.com/'],
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

  it('covers the page URL, query string and referrer in the shared telemetry data', () => {
    window.history.replaceState({}, '', '/project/abc/auth/users?keywords=person%40example.com')
    Object.defineProperty(document, 'referrer', { value: `${LEAKING_URL}&sortBy=id` })

    const data = getSharedTelemetryData()

    expect(data.page_url).toBe(`${window.location.origin}/project/abc/auth/users?keywords=redacted`)
    expect(data.ph.search).toBe('?keywords=redacted')
    expect(data.ph.referrer).toBe(`${REDACTED_URL}&sortBy=id`)
  })
})
