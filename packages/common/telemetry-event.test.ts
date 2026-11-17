import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sendTelemetryEvent } from './telemetry'
import { buildTelemetryEventRequest } from './telemetry-event'

const { consent, platform, post } = vi.hoisted(() => ({
  consent: { value: true },
  platform: { value: undefined as string | undefined },
  post: vi.fn(() => Promise.resolve()),
}))

vi.mock('./consent-state', () => ({
  hasConsented: () => consent.value,
  useConsentState: () => ({ hasAccepted: consent.value }),
}))
vi.mock('./telemetry-utils', () => ({
  getSharedTelemetryData: () => ({ page_title: 'Page' }),
  getTelemetryCookieOptions: () => ({}),
  getTelemetryPlatform: () => platform.value,
}))
vi.mock('./fetchWrappers', () => ({ post }))
vi.mock('./auth', () => ({ useUser: () => null }))

const API_URL = 'https://api.example.com'

beforeEach(() => {
  consent.value = true
  platform.value = undefined
  post.mockClear()
})

describe('buildTelemetryEventRequest', () => {
  it('returns null without consent', () => {
    consent.value = false
    expect(
      buildTelemetryEventRequest(API_URL, {
        action: 'explorer_banner_exposed',
        groups: { project: 'p', organization: 'o' },
      })
    ).toBeNull()
  })

  it('sets the Explorer page title for explorer_ events only', () => {
    const explorer = buildTelemetryEventRequest(API_URL, {
      action: 'explorer_banner_exposed',
      groups: { project: 'p', organization: 'o' },
    })
    const other = buildTelemetryEventRequest(API_URL, {
      action: 'kb_search_submitted',
      properties: { query: 'abc', queryLength: 3, resultCount: 1, hasResults: true },
    })
    expect(explorer?.body.page_title).toBe('Explorer')
    expect(other?.body.page_title).toBe('Page')
  })

  it('drops an Unknown project, and all groups when the organization is Unknown too', () => {
    const projectOnly = buildTelemetryEventRequest(API_URL, {
      action: 'explorer_banner_exposed',
      groups: { project: 'Unknown', organization: 'o' },
    })
    const both = buildTelemetryEventRequest(API_URL, {
      action: 'explorer_banner_exposed',
      groups: { project: 'Unknown', organization: 'Unknown' },
    })
    expect(projectOnly?.body.groups).toEqual({ organization: 'o' })
    expect(both?.body).not.toHaveProperty('groups')
  })

  it('targets the platform endpoint and sets keepalive by action', () => {
    const click = buildTelemetryEventRequest(API_URL, {
      action: 'kb_search_result_clicked',
      properties: { resultPath: '/kb/a', resultPosition: 1, resultCount: 1 },
    })
    const submit = buildTelemetryEventRequest(API_URL, {
      action: 'kb_search_submitted',
      properties: { query: 'abc', queryLength: 3, resultCount: 1, hasResults: true },
    })
    expect(click?.url).toBe('https://api.example.com/platform/telemetry/event')
    expect(click?.keepalive).toBe(true)
    expect(submit?.keepalive).toBe(false)
  })

  it("adds the app's platform to custom_properties only once it is set", () => {
    const event = {
      action: 'kb_search_submitted',
      properties: { query: 'abc', queryLength: 3, resultCount: 1, hasResults: true },
    } as const
    const unset = buildTelemetryEventRequest(API_URL, event)
    platform.value = 'kb'
    const set = buildTelemetryEventRequest(API_URL, event)

    expect(unset?.body.custom_properties).toStrictEqual(event.properties)
    expect(set?.body.custom_properties).toStrictEqual({ ...event.properties, platform: 'kb' })
  })

  it('builds the same endpoint whether the API URL has a trailing slash or /platform', () => {
    const event = {
      action: 'kb_search_submitted',
      properties: { query: 'abc', queryLength: 3, resultCount: 1, hasResults: true },
    } as const
    for (const apiUrl of [
      'https://api.example.com/',
      'https://api.example.com/platform',
      'https://api.example.com/platform/',
      'https://api.example.com//',
      'https://api.example.com/platform//',
    ]) {
      expect(buildTelemetryEventRequest(apiUrl, event)?.url).toBe(
        'https://api.example.com/platform/telemetry/event'
      )
    }
  })
})

describe('sendTelemetryEvent', () => {
  it('posts the built request with the v2 header and keepalive', async () => {
    await sendTelemetryEvent(API_URL, {
      action: 'kb_search_result_clicked',
      properties: { resultPath: '/kb/a', resultPosition: 2, resultCount: 3 },
    })
    expect(post).toHaveBeenCalledWith(
      'https://api.example.com/platform/telemetry/event',
      expect.objectContaining({
        action: 'kb_search_result_clicked',
        custom_properties: { resultPath: '/kb/a', resultPosition: 2, resultCount: 3 },
      }),
      { headers: { Version: '2' }, keepalive: true }
    )
  })

  it('posts nothing without consent', async () => {
    consent.value = false
    await sendTelemetryEvent(API_URL, {
      action: 'kb_search_submitted',
      properties: { query: 'abc', queryLength: 3, resultCount: 1, hasResults: true },
    })
    expect(post).not.toHaveBeenCalled()
  })
})
