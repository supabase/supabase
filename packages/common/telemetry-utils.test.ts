// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getSharedTelemetryData,
  redactEventUrlKeywords,
  redactUrlKeywords,
} from './telemetry-utils'

// The real module reads window.matchMedia on import, which jsdom does not implement.
vi.mock('./helpers', () => ({ isBrowser: true }))

const USERS_PAGE = 'https://supabase.com/dashboard/project/abc/auth/users'

function setReferrer(referrer: string) {
  Object.defineProperty(document, 'referrer', { value: referrer, configurable: true })
}

afterEach(() => {
  window.history.replaceState({}, '', '/')
  setReferrer('')
})

describe('redactUrlKeywords', () => {
  it.each([
    [`${USERS_PAGE}?keywords=person%40example.com`, `${USERS_PAGE}?keywords=redacted`],
    [
      `${USERS_PAGE}?sortBy=id&keywords=jane+doe&filter=verified`,
      `${USERS_PAGE}?sortBy=id&keywords=redacted&filter=verified`,
    ],
    [`${USERS_PAGE}?keywords=abc#row-3`, `${USERS_PAGE}?keywords=redacted#row-3`],
    ['?keywords=%2B15555550100', '?keywords=redacted'],
  ])('replaces the keywords value in %s', (url, redacted) => {
    expect(redactUrlKeywords(url)).toBe(redacted)
  })

  it.each([`${USERS_PAGE}?sortBy=id`, `${USERS_PAGE}?mykeywords=abc`, 'https://example.com/', ''])(
    'leaves %j unchanged',
    (url) => {
      expect(redactUrlKeywords(url)).toBe(url)
    }
  )
})

describe('redactEventUrlKeywords', () => {
  it('redacts keywords in every URL property the SDK adds, wherever it sits on the event', () => {
    const leakingUrl = `${USERS_PAGE}?keywords=person%40example.com`
    const event = {
      properties: {
        $current_url: leakingUrl,
        $referrer: leakingUrl,
        $session_entry_url: leakingUrl,
        $set: { last_page: leakingUrl },
        $set_once: { $initial_current_url: leakingUrl, $initial_referrer: leakingUrl },
      },
      $set: { last_page: leakingUrl },
      $set_once: { $initial_current_url: leakingUrl, $initial_referrer: leakingUrl },
    }

    redactEventUrlKeywords(event)

    expect(JSON.stringify(event)).not.toContain('person')
    expect(event.properties.$session_entry_url).toBe(`${USERS_PAGE}?keywords=redacted`)
    expect(event.properties.$set_once.$initial_referrer).toBe(`${USERS_PAGE}?keywords=redacted`)
    expect(event.$set_once.$initial_current_url).toBe(`${USERS_PAGE}?keywords=redacted`)
  })

  it('leaves other properties as they are', () => {
    const event = {
      properties: { $pathname: '/project/[ref]/auth/users', viewport_width: 1280, tags: ['a'] },
    }

    redactEventUrlKeywords(event)

    expect(event.properties).toEqual({
      $pathname: '/project/[ref]/auth/users',
      viewport_width: 1280,
      tags: ['a'],
    })
  })
})

describe('getSharedTelemetryData', () => {
  it('redacts keywords in the page URL, the query string and the referrer', () => {
    window.history.replaceState({}, '', '/project/abc/auth/users?keywords=person%40example.com')
    setReferrer(`${USERS_PAGE}?keywords=other%40example.com&sortBy=id`)

    const data = getSharedTelemetryData()

    expect(data.page_url).toBe(`${window.location.origin}/project/abc/auth/users?keywords=redacted`)
    expect(data.ph.search).toBe('?keywords=redacted')
    expect(data.ph.referrer).toBe(`${USERS_PAGE}?keywords=redacted&sortBy=id`)
  })
})
