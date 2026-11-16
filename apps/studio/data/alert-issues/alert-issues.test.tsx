import { useQuery } from '@tanstack/react-query'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { useAlertIssueActionMutation } from './alert-issue-action-mutation'
import { alertIssuesQueryOptions } from './alert-issues-query'
import { useAlertIssuesReadMutation } from './alert-issues-read-mutation'
import { API_URL } from '@/lib/constants'
import { customRenderHook } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

const REF = 'default'
const BASE = `${API_URL}/platform/projects/:ref/alerts/issues`

const ISSUE = {
  alert_issue_id: 'a1',
  status: 'open',
  change: 'opened',
  title: 'Edge function errors',
  description: null,
  severity: 'major',
  category: 'performance',
  rule_key: 'logflare.edge-fn-5xx',
  identifiers: { project: 'default', function_id: 'stripe-webhook' },
  metadata: { row_count: 3 },
  signal_count: 3,
  first_seen_at: '2026-11-16T12:00:00Z',
  last_seen_at: '2026-11-16T12:10:00Z',
  attention_at: '2026-11-16T12:00:00Z',
  actor: 'system',
  unread: true,
}

describe('alert issues hooks', () => {
  it('lists the project alert issues', async () => {
    mswServer.use(http.get(BASE, () => HttpResponse.json([ISSUE])))

    const { result } = customRenderHook(() =>
      useQuery({ ...alertIssuesQueryOptions({ projectRef: REF }), enabled: true })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([ISSUE])
  })

  it('refetches every 30 seconds so new alert issues appear while the page is open', () => {
    expect(alertIssuesQueryOptions({ projectRef: REF }).refetchInterval).toBe(30_000)
  })

  it('surfaces an invalid response as an error', async () => {
    mswServer.use(http.get(BASE, () => HttpResponse.json([{ alert_issue_id: 1 }])))

    const { result } = customRenderHook(() =>
      useQuery({ ...alertIssuesQueryOptions({ projectRef: REF }), enabled: true })
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('surfaces API errors', async () => {
    mswServer.use(
      http.get(BASE, () => HttpResponse.json({ message: 'Logflare is down' }, { status: 500 }))
    )

    const { result } = customRenderHook(() =>
      useQuery({ ...alertIssuesQueryOptions({ projectRef: REF }), enabled: true })
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toContain('Logflare is down')
  })

  it('applies an action to an alert issue', async () => {
    let received: unknown
    mswServer.use(
      http.post(`${BASE}/:alertIssueId/actions`, async ({ request, params }) => {
        received = { id: params.alertIssueId, body: await request.json() }
        return HttpResponse.json({ ...ISSUE, status: 'acknowledged' })
      })
    )

    const { result } = customRenderHook(() => useAlertIssueActionMutation())
    result.current.mutate({ projectRef: REF, alertIssueId: 'a1', action: 'acknowledge' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(received).toEqual({ id: 'a1', body: { action: 'acknowledge' } })
    expect(result.current.data?.status).toBe('acknowledged')
  })

  it('keeps the action result in the cached list when a refetch is still stale', async () => {
    mswServer.use(
      http.get(BASE, () => HttpResponse.json([ISSUE])),
      http.post(`${BASE}/:alertIssueId/actions`, () =>
        HttpResponse.json({ ...ISSUE, status: 'acknowledged', unread: undefined })
      )
    )

    const { result } = customRenderHook(() => ({
      list: useQuery({ ...alertIssuesQueryOptions({ projectRef: REF }), enabled: true }),
      action: useAlertIssueActionMutation(),
    }))
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    result.current.action.mutate({ projectRef: REF, alertIssueId: 'a1', action: 'acknowledge' })

    await waitFor(() => expect(result.current.action.isSuccess).toBe(true))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(result.current.list.data?.[0]).toMatchObject({ status: 'acknowledged', unread: true })
  })

  it('marks alert issues read in the cached list', async () => {
    mswServer.use(
      http.get(BASE, () => HttpResponse.json([ISSUE])),
      http.post(`${BASE}/reads`, () => HttpResponse.json({ count: 1 }))
    )

    const { result } = customRenderHook(() => ({
      list: useQuery({ ...alertIssuesQueryOptions({ projectRef: REF }), enabled: true }),
      read: useAlertIssuesReadMutation(),
    }))
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    result.current.read.mutate({ projectRef: REF, alertIssueIds: ['a1'], read: true })

    await waitFor(() => expect(result.current.read.isSuccess).toBe(true))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(result.current.list.data?.[0].unread).toBe(false)
  })

  it('marks alert issues read', async () => {
    let received: unknown
    mswServer.use(
      http.post(`${BASE}/reads`, async ({ request }) => {
        received = await request.json()
        return HttpResponse.json({ count: 1 })
      })
    )

    const { result } = customRenderHook(() => useAlertIssuesReadMutation())
    result.current.mutate({ projectRef: REF, alertIssueIds: ['a1'], read: true })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(received).toEqual({ alert_issue_ids: ['a1'], read: true })
  })
})
