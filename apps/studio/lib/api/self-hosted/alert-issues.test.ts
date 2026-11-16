import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()

async function loadModule() {
  vi.resetModules()
  vi.stubEnv('LOGFLARE_URL', 'https://logflare.example.com')
  vi.stubEnv('LOGFLARE_PRIVATE_ACCESS_TOKEN', 'secret-token')
  return import('./alert-issues')
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('api/self-hosted/alert-issues', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  describe('listAlertIssues', () => {
    it('scopes the request to the project and the self-hosted reader', async () => {
      fetchMock.mockResolvedValue(jsonResponse([{ alert_issue_id: 'a1' }]))
      const { listAlertIssues } = await loadModule()

      const result = await listAlertIssues({ projectRef: 'default', status: 'open,acknowledged' })

      expect(result).toEqual({ data: [{ alert_issue_id: 'a1' }], error: undefined })
      const [url, init] = fetchMock.mock.calls[0]
      const parsed = new URL(url)
      expect(parsed.origin + parsed.pathname).toBe('https://logflare.example.com/api/alerts/issues')
      expect(parsed.searchParams.get('filters[identifiers.project]')).toBe('default')
      expect(parsed.searchParams.get('reader')).toBe('self-hosted')
      expect(parsed.searchParams.get('status')).toBe('open,acknowledged')
      expect(init.method).toBe('GET')
      expect(init.headers['x-api-key']).toBe('secret-token')
    })

    it('returns the Logflare error message on failure', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ error: 'filters required' }, 400))
      const { listAlertIssues } = await loadModule()

      const result = await listAlertIssues({ projectRef: 'default' })

      expect(result.data).toBeUndefined()
      expect(result.error?.message).toBe('filters required')
    })
  })

  describe('applyAlertIssueAction', () => {
    it('posts the action with the project filter', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ alert_issue_id: 'a1', status: 'acknowledged' }))
      const { applyAlertIssueAction } = await loadModule()

      const result = await applyAlertIssueAction({
        projectRef: 'default',
        alertIssueId: 'a/1',
        action: 'acknowledge',
      })

      expect(result.data).toEqual({ alert_issue_id: 'a1', status: 'acknowledged' })
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe('https://logflare.example.com/api/alerts/issues/a%2F1/actions')
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body)).toEqual({
        action: 'acknowledge',
        actor: 'self-hosted',
        filters: { 'identifiers.project': 'default' },
      })
    })

    it('includes until when snoozing', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ alert_issue_id: 'a1', status: 'snoozed' }))
      const { applyAlertIssueAction } = await loadModule()

      await applyAlertIssueAction({
        projectRef: 'default',
        alertIssueId: 'a1',
        action: 'snooze',
        until: '2026-11-16T13:00:00Z',
      })

      expect(JSON.parse(fetchMock.mock.calls[0][1].body).until).toBe('2026-11-16T13:00:00Z')
    })
  })

  describe('markAlertIssuesRead', () => {
    it('posts reads for the self-hosted reader', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ count: 2 }))
      const { markAlertIssuesRead } = await loadModule()

      const result = await markAlertIssuesRead({
        projectRef: 'default',
        alertIssueIds: ['a1', 'a2'],
        read: false,
      })

      expect(result.data).toEqual({ count: 2 })
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe('https://logflare.example.com/api/alerts/issues/reads')
      expect(JSON.parse(init.body)).toEqual({
        alert_issue_ids: ['a1', 'a2'],
        reader: 'self-hosted',
        read: false,
        filters: { 'identifiers.project': 'default' },
      })
    })
  })
})
