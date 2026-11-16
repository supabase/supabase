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

  describe('alert issue comments', () => {
    it('lists comments scoped to the project', async () => {
      fetchMock.mockResolvedValue(jsonResponse([{ comment_id: 'c1' }]))
      const { listAlertIssueComments } = await loadModule()

      const result = await listAlertIssueComments({ projectRef: 'default', alertIssueId: 'a/1' })

      expect(result.data).toEqual([{ comment_id: 'c1' }])
      const parsed = new URL(fetchMock.mock.calls[0][0])
      expect(parsed.pathname).toBe('/api/alerts/issues/a%2F1/comments')
      expect(parsed.searchParams.get('filters[identifiers.project]')).toBe('default')
    })

    it('posts a comment as the self-hosted user', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ comment_id: 'c1' }, 201))
      const { createAlertIssueComment } = await loadModule()

      await createAlertIssueComment({ projectRef: 'default', alertIssueId: 'a1', body: 'On it' })

      const [url, init] = fetchMock.mock.calls[0]
      expect(new URL(url).searchParams.get('filters[identifiers.project]')).toBe('default')
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body)).toEqual({ author: 'self-hosted', body: 'On it' })
    })
  })

  describe('getAlertIssueEvents', () => {
    it('passes the time range and project scope', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ total: 0, events: [], buckets: [] }))
      const { getAlertIssueEvents } = await loadModule()

      await getAlertIssueEvents({
        projectRef: 'default',
        alertIssueId: 'a1',
        from: '2026-11-16T11:00:00Z',
        to: '2026-11-16T12:00:00Z',
      })

      const parsed = new URL(fetchMock.mock.calls[0][0])
      expect(parsed.pathname).toBe('/api/alerts/issues/a1/events')
      expect(parsed.searchParams.get('from')).toBe('2026-11-16T11:00:00Z')
      expect(parsed.searchParams.get('to')).toBe('2026-11-16T12:00:00Z')
      expect(parsed.searchParams.get('filters[identifiers.project]')).toBe('default')
    })

    it('keeps the Logflare status on errors', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ error: 'no preview' }, 422))
      const { getAlertIssueEvents } = await loadModule()

      const result = await getAlertIssueEvents({ projectRef: 'default', alertIssueId: 'a1' })

      expect(result.error?.message).toBe('no preview')
      expect(result.error).toMatchObject({ status: 422 })
    })
  })

  describe('previewAlertRule', () => {
    it('posts the LQL and range', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ total: 3, events: [], buckets: [] }))
      const { previewAlertRule } = await loadModule()

      await previewAlertRule({ lql: 'f:edge_logs m.status:>=500', from: 'a', to: 'b' })

      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe('https://logflare.example.com/api/alerts/preview')
      expect(JSON.parse(init.body)).toEqual({
        lql: 'f:edge_logs m.status:>=500',
        from: 'a',
        to: 'b',
      })
    })
  })

  describe('alert issue types', () => {
    it('lists issue types with the project silence state', async () => {
      fetchMock.mockResolvedValue(jsonResponse([{ rule_key: 'r1' }]))
      const { listAlertIssueTypes } = await loadModule()

      await listAlertIssueTypes({ projectRef: 'default' })

      const parsed = new URL(fetchMock.mock.calls[0][0])
      expect(parsed.pathname).toBe('/api/alerts/issue_types')
      expect(parsed.searchParams.get('filters[identifiers.project]')).toBe('default')
    })

    it('creates a custom rule scoped to the project', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ rule_key: 'custom.errors' }, 201))
      const { createAlertIssueType } = await loadModule()

      await createAlertIssueType({
        projectRef: 'default',
        name: 'Errors',
        lql: 'f:edge_logs m.status:>=500',
        severity: 'major',
        category: 'health',
        group_by: ['metadata.function_id'],
      })

      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
        name: 'Errors',
        lql: 'f:edge_logs m.status:>=500',
        severity: 'major',
        category: 'health',
        group_by: ['metadata.function_id'],
        identifiers: { project: 'default' },
      })
    })

    it('deletes a custom rule and handles an empty response', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
      const { deleteAlertIssueType } = await loadModule()

      const result = await deleteAlertIssueType({ ruleKey: 'custom.errors' })

      expect(result).toEqual({ data: null, error: undefined })
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe('https://logflare.example.com/api/alerts/issue_types/custom.errors')
      expect(init.method).toBe('DELETE')
    })
  })

  describe('alert silences', () => {
    it('silences a rule for the project only', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ id: 's1' }, 201))
      const { createAlertSilence } = await loadModule()

      await createAlertSilence({ projectRef: 'default', ruleKey: 'r1' })

      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe('https://logflare.example.com/api/alerts/silences')
      expect(JSON.parse(init.body)).toEqual({
        rule_key: 'r1',
        matchers: { project: 'default' },
        created_by: 'self-hosted',
      })
    })

    it('deletes a silence', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
      const { deleteAlertSilence } = await loadModule()

      await deleteAlertSilence({ silenceId: 's1' })

      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe('https://logflare.example.com/api/alerts/silences/s1')
      expect(init.method).toBe('DELETE')
    })
  })

  describe('getProxyErrorStatus', () => {
    it('passes client errors through and hides the rest', async () => {
      const { getProxyErrorStatus, LogflareRequestError } = await loadModule()

      expect(getProxyErrorStatus(new LogflareRequestError('bad lql', 422))).toBe(422)
      expect(getProxyErrorStatus(new LogflareRequestError('no key', 401))).toBe(500)
      expect(getProxyErrorStatus(new Error('offline'))).toBe(500)
    })
  })
})
