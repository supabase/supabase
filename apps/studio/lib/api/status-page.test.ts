import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { mswServer } from '@/tests/lib/msw'

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return { ...actual, IS_PLATFORM: true }
})

const WIDGET_URL = 'https://api.incident.io/widget'
const API_KEY = 'test-api-key'
const STATUS_PAGE_ID = 'test-status-page-id'

function stubHappyEnv() {
  vi.stubEnv('INCIDENT_IO_WIDGET_URL', WIDGET_URL)
  vi.stubEnv('INCIDENT_IO_API_KEY', API_KEY)
  vi.stubEnv('INCIDENT_IO_STATUS_PAGE_ID', STATUS_PAGE_ID)
}

function widgetFixture() {
  return {
    page_title: 'Supabase Status',
    page_url: 'https://status.supabase.com',
    ongoing_incidents: [
      {
        id: 'incident-1',
        name: 'Elevated error rates',
        url: 'https://status.supabase.com/incidents/incident-1',
        last_update_at: '2026-01-01T00:00:00Z',
        last_update_message: 'Investigating',
        status: 'investigating',
        current_worst_impact: 'partial_outage',
        affected_components: [
          {
            id: 'component-1',
            name: 'API',
            group_name: null,
            current_status: 'partial_outage',
          },
        ],
      },
    ],
    in_progress_maintenances: [],
    scheduled_maintenances: [],
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('getStatusPage', () => {
  test('happy path: annotates the item from its linked response incident', async () => {
    stubHappyEnv()
    mswServer.use(
      http.get(WIDGET_URL, () => HttpResponse.json(widgetFixture())),
      http.get('*/v1/status-pages/:statusPageId/incidents/:itemId/response-incidents', () =>
        HttpResponse.json({
          incidents: [{ id: 'response-incident-1', linked_at: '2026-01-01T00:00:00Z' }],
        })
      ),
      http.get('*/v2/incidents/:id', () =>
        HttpResponse.json({
          incident: {
            id: 'response-incident-1',
            custom_field_entries: [],
          },
        })
      )
    )

    const { getStatusPage } = await import('./status-page')
    const result = await getStatusPage()

    expect(result.isDegraded).toBe(false)
    expect(result.data.ongoing_incidents[0]).toMatchObject({
      id: 'incident-1',
      visible: true,
      show_banner: true,
    })
  })

  test('link endpoint 404 → item gets default annotations, isDegraded stays false', async () => {
    stubHappyEnv()
    mswServer.use(
      http.get(WIDGET_URL, () => HttpResponse.json(widgetFixture())),
      http.get(
        '*/v1/status-pages/:statusPageId/incidents/:itemId/response-incidents',
        () => new HttpResponse(null, { status: 404 })
      )
    )

    const { getStatusPage } = await import('./status-page')
    const result = await getStatusPage()

    expect(result.data.ongoing_incidents[0]).toMatchObject({
      visible: true,
      show_banner: true,
    })
    expect(result.isDegraded).toBe(false)
  })

  test('/v2/incidents/:id failing → item gets default annotations AND isDegraded true', async () => {
    stubHappyEnv()
    mswServer.use(
      http.get(WIDGET_URL, () => HttpResponse.json(widgetFixture())),
      http.get('*/v1/status-pages/:statusPageId/incidents/:itemId/response-incidents', () =>
        HttpResponse.json({
          incidents: [{ id: 'response-incident-1', linked_at: '2026-01-01T00:00:00Z' }],
        })
      ),
      http.get('*/v2/incidents/:id', () => new HttpResponse(null, { status: 500 }))
    )

    const { getStatusPage } = await import('./status-page')
    const result = await getStatusPage()

    expect(result.data.ongoing_incidents[0]).toMatchObject({
      visible: true,
      show_banner: true,
    })
    expect(result.isDegraded).toBe(true)
  })

  test('widget returns 503 → getStatusPage rejects', async () => {
    stubHappyEnv()
    mswServer.use(http.get(WIDGET_URL, () => new HttpResponse(null, { status: 503 })))

    const { getStatusPage } = await import('./status-page')
    await expect(getStatusPage()).rejects.toThrow()
  })

  test('missing API key / status page ID → succeeds with default annotations everywhere, isDegraded true', async () => {
    vi.stubEnv('INCIDENT_IO_WIDGET_URL', WIDGET_URL)
    vi.stubEnv('INCIDENT_IO_API_KEY', '')
    vi.stubEnv('INCIDENT_IO_STATUS_PAGE_ID', '')
    mswServer.use(http.get(WIDGET_URL, () => HttpResponse.json(widgetFixture())))

    const { getStatusPage } = await import('./status-page')
    const result = await getStatusPage()

    expect(result.isDegraded).toBe(true)
    expect(result.data.ongoing_incidents[0]).toMatchObject({
      visible: true,
      show_banner: true,
    })
  })

  test('real payload: scheduled maintenance without starts_at/ends_at still parses', async () => {
    stubHappyEnv()

    const realPayload = {
      page_title: 'Supabase',
      page_url: 'https://statuspage.incident.io/supabase',
      ongoing_incidents: [
        {
          name: '401 errors due to JWT rejections',
          status: 'identified',
          url: 'https://statuspage.incident.io/supabase/incidents/01KZZ19EQMSC9DNDA15ZGVY19V',
          id: '01KZZ19EQMSC9DNDA15ZGVY19V',
          current_worst_impact: 'degraded_performance',
          affected_components: [
            {
              id: '01KJZVWMNKQ0HV8DXHRSSERV5T',
              name: 'API Gateway',
              current_status: 'degraded_performance',
            },
          ],
          last_update_at: '2026-09-25T16:23:02.23Z',
          last_update_message:
            'The deployment process changes have been rolled out across all regions. We will monitor throughout the weekend.',
        },
      ],
      in_progress_maintenances: [],
      scheduled_maintenances: [
        {
          id: '01KWA5M6EAYR6F74N18REZNYQ1',
          name: 'Scheduled Platform Maintenance 07/02',
          status: 'maintenance_scheduled',
          url: 'https://statuspage.incident.io/supabase/incidents/01KWA5M6EAYR6F74N18REZNYQ1',
          affected_components: [],
          last_update_at: '2026-06-29T16:56:35.249Z',
          last_update_message: 'We will be carrying out a scheduled maintenance window...',
        },
      ],
    }

    mswServer.use(
      http.get(WIDGET_URL, () => HttpResponse.json(realPayload)),
      http.get(
        '*/v1/status-pages/:statusPageId/incidents/:itemId/response-incidents',
        () => new HttpResponse(null, { status: 404 })
      )
    )

    const { getStatusPage } = await import('./status-page')
    const result = await getStatusPage()

    expect(result.isDegraded).toBe(false)
    expect(result.data.ongoing_incidents).toHaveLength(1)
    expect(result.data.scheduled_maintenances).toHaveLength(1)
    expect(result.data.scheduled_maintenances[0]).toMatchObject({
      id: '01KWA5M6EAYR6F74N18REZNYQ1',
      visible: true,
      show_banner: true,
      banner_lead_days: null,
    })
    expect(result.data.scheduled_maintenances[0].starts_at).toBeUndefined()
    expect(result.data.scheduled_maintenances[0].ends_at).toBeUndefined()
  })
})

describe('fetchWithRetry backoff (via getStatusPage widget fetch)', () => {
  test('a Retry-After that parses to 0 does not skip the equal-jitter backoff floor', async () => {
    stubHappyEnv()
    vi.useFakeTimers()
    // Equal jitter is `base / 2 + random() * (base / 2)`; pinning random() to 0 collapses it to
    // the deterministic floor (base / 2) so the wait boundary below is exact, not probabilistic.
    vi.spyOn(Math, 'random').mockReturnValue(0)

    let widgetCallCount = 0
    mswServer.use(
      http.get(WIDGET_URL, () => {
        widgetCallCount++
        if (widgetCallCount === 1) {
          return new HttpResponse(null, {
            status: 429,
            headers: { 'Retry-After': new Date(Date.now() - 10_000).toUTCString() },
          })
        }
        return HttpResponse.json(widgetFixture())
      }),
      http.get(
        '*/v1/status-pages/:statusPageId/incidents/:itemId/response-incidents',
        () => new HttpResponse(null, { status: 404 })
      )
    )

    const { getStatusPage } = await import('./status-page')
    const resultPromise = getStatusPage()

    await vi.advanceTimersByTimeAsync(0)
    expect(widgetCallCount).toBe(1)

    // Backoff floor for the first retry (attempt 0) is (1000 * 2 ** 0) / 2 = 500ms with
    // Math.random() pinned to 0.
    await vi.advanceTimersByTimeAsync(499)
    expect(widgetCallCount).toBe(1)

    // Crossing the floor triggers the retry.
    await vi.advanceTimersByTimeAsync(1)
    expect(widgetCallCount).toBe(2)

    const result = await resultPromise
    expect(result.data.ongoing_incidents[0].id).toBe('incident-1')
  })
})

describe('GET /api/status-page route Cache-Control header', () => {
  test('success → 300s cache with 300s stale-while-revalidate', async () => {
    stubHappyEnv()
    mswServer.use(
      http.get(WIDGET_URL, () => HttpResponse.json(widgetFixture())),
      http.get(
        '*/v1/status-pages/:statusPageId/incidents/:itemId/response-incidents',
        () => new HttpResponse(null, { status: 404 })
      )
    )

    const { GET } = await import('../../app/api/status-page/route')
    const response = await GET()

    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=300'
    )
  })

  test('degraded (missing config) → 60s cache with 60s stale-while-revalidate', async () => {
    vi.stubEnv('INCIDENT_IO_WIDGET_URL', WIDGET_URL)
    vi.stubEnv('INCIDENT_IO_API_KEY', '')
    vi.stubEnv('INCIDENT_IO_STATUS_PAGE_ID', '')
    mswServer.use(http.get(WIDGET_URL, () => HttpResponse.json(widgetFixture())))

    const { GET } = await import('../../app/api/status-page/route')
    const response = await GET()

    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=60, stale-while-revalidate=60'
    )
  })

  test('error (widget 503) → no-store', async () => {
    stubHappyEnv()
    mswServer.use(http.get(WIDGET_URL, () => new HttpResponse(null, { status: 503 })))

    const { GET } = await import('../../app/api/status-page/route')
    const response = await GET()

    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })
})
