import { useQuery } from '@tanstack/react-query'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { useAlertIssueCommentCreateMutation } from './alert-issue-comment-create-mutation'
import { alertIssueCommentsQueryOptions } from './alert-issue-comments-query'
import { alertIssueEventsQueryOptions } from './alert-issue-events-query'
import { API_URL } from '@/lib/constants'
import { customRenderHook } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

const REF = 'default'
const ISSUE_URL = `${API_URL}/platform/projects/:ref/alerts/issues/:alertIssueId`

const COMMENT = {
  comment_id: 'c1',
  alert_issue_id: 'a1',
  author: 'self-hosted',
  body: 'Rolled back the deploy',
  created_at: '2026-11-16T12:00:00Z',
}

const EVENTS = {
  lql: 'f:function_edge_logs m.function_id:stripe-webhook',
  source: 'function_edge_logs',
  from: '2026-11-16T11:00:00Z',
  to: '2026-11-16T12:00:00Z',
  total: 2,
  buckets: [{ timestamp: '2026-11-16T11:00:00Z', count: 2 }],
  events: [
    {
      id: 'e1',
      timestamp: '2026-11-16T11:30:00Z',
      event_message: 'POST /functions/v1/stripe-webhook 500',
      body: { metadata: { status: 500 } },
    },
  ],
}

describe('alert issue comments', () => {
  it('lists the comments of an alert issue', async () => {
    mswServer.use(http.get(`${ISSUE_URL}/comments`, () => HttpResponse.json([COMMENT])))

    const { result } = customRenderHook(() =>
      useQuery({
        ...alertIssueCommentsQueryOptions({ projectRef: REF, alertIssueId: 'a1' }),
        enabled: true,
      })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([COMMENT])
  })

  it('appends a new comment to the cached list', async () => {
    let received: unknown
    mswServer.use(
      http.get(`${ISSUE_URL}/comments`, () => HttpResponse.json([COMMENT])),
      http.post(`${ISSUE_URL}/comments`, async ({ request }) => {
        received = await request.json()
        return HttpResponse.json({ ...COMMENT, comment_id: 'c2', body: 'Fixed' }, { status: 201 })
      })
    )

    const { result } = customRenderHook(() => ({
      list: useQuery({
        ...alertIssueCommentsQueryOptions({ projectRef: REF, alertIssueId: 'a1' }),
        enabled: true,
      }),
      create: useAlertIssueCommentCreateMutation(),
    }))
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    result.current.create.mutate({ projectRef: REF, alertIssueId: 'a1', body: 'Fixed' })

    await waitFor(() => expect(result.current.create.isSuccess).toBe(true))
    expect(received).toEqual({ body: 'Fixed' })
    await waitFor(() =>
      expect(result.current.list.data?.map((comment) => comment.comment_id)).toEqual(['c1', 'c2'])
    )
  })

  it('posts a comment as the Supabase Assistant', async () => {
    let received: unknown
    mswServer.use(
      http.post(`${ISSUE_URL}/comments`, async ({ request }) => {
        received = await request.json()
        return HttpResponse.json(
          { ...COMMENT, comment_id: 'c3', author: 'Supabase Assistant' },
          { status: 201 }
        )
      })
    )

    const { result } = customRenderHook(() => useAlertIssueCommentCreateMutation())
    result.current.mutate({
      projectRef: REF,
      alertIssueId: 'a1',
      body: 'Found it',
      asAssistant: true,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(received).toEqual({ body: 'Found it', as_assistant: true })
  })
})

describe('alert issue events', () => {
  it('fetches the log events for a time range', async () => {
    let params: URLSearchParams | undefined
    mswServer.use(
      http.get(`${ISSUE_URL}/events`, ({ request }) => {
        params = new URL(request.url).searchParams
        return HttpResponse.json(EVENTS)
      })
    )

    const { result } = customRenderHook(() =>
      useQuery({
        ...alertIssueEventsQueryOptions({ projectRef: REF, alertIssueId: 'a1', range: '1h' }),
        enabled: true,
      })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.total).toBe(2)
    const from = new Date(params!.get('from')!).getTime()
    const to = new Date(params!.get('to')!).getTime()
    expect(to - from).toBe(60 * 60 * 1000)
  })

  it('reports a missing preview as unavailable instead of an error', async () => {
    mswServer.use(
      http.get(`${ISSUE_URL}/events`, () =>
        HttpResponse.json({ error: { message: 'no preview' } }, { status: 422 })
      )
    )

    const { result } = customRenderHook(() =>
      useQuery({
        ...alertIssueEventsQueryOptions({ projectRef: REF, alertIssueId: 'a1', range: '24h' }),
        enabled: true,
      })
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })
})
