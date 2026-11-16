import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { AlertIssueLogEvents } from './AlertIssueLogEvents'
import { API_URL } from '@/lib/constants'
import { customRender } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

const EVENTS_URL = `${API_URL}/platform/projects/:ref/alerts/issues/:alertIssueId/events`

const events = (total: number) => ({
  lql: 'f:function_edge_logs m.function_id:stripe-webhook',
  source: 'function_edge_logs',
  from: '2026-11-15T12:00:00Z',
  to: '2026-11-16T12:00:00Z',
  total,
  buckets: [{ timestamp: '2026-11-16T11:00:00Z', count: total }],
  events:
    total === 0
      ? []
      : [
          {
            id: 'e1',
            timestamp: '2026-11-16T11:30:00Z',
            event_message: 'POST /functions/v1/stripe-webhook 500',
            body: { metadata: { status: 500, function_id: 'stripe-webhook' } },
          },
        ],
})

describe('AlertIssueLogEvents', () => {
  it('lists the log events for the last 24 hours and switches range', async () => {
    const windows: number[] = []
    mswServer.use(
      http.get(EVENTS_URL, ({ request }) => {
        const params = new URL(request.url).searchParams
        windows.push(
          new Date(params.get('to')!).getTime() - new Date(params.get('from')!).getTime()
        )
        return HttpResponse.json(events(12))
      })
    )

    customRender(<AlertIssueLogEvents projectRef="default" alertIssueId="a1" />)

    expect(await screen.findByText('POST /functions/v1/stripe-webhook 500')).toBeInTheDocument()
    expect(screen.getByText('12 events')).toBeInTheDocument()
    expect(
      screen.getByText(/f:function_edge_logs m.function_id:stripe-webhook/)
    ).toBeInTheDocument()
    expect(windows[0]).toBe(24 * 60 * 60 * 1000)

    await userEvent.click(screen.getByRole('radio', { name: 'Last hour' }))
    await screen.findByText('12 events')
    expect(windows.at(-1)).toBe(60 * 60 * 1000)
  })

  it('expands a log event to show its body', async () => {
    mswServer.use(http.get(EVENTS_URL, () => HttpResponse.json(events(1))))

    customRender(<AlertIssueLogEvents projectRef="default" alertIssueId="a1" />)

    await userEvent.click(
      await screen.findByRole('button', { name: /POST \/functions\/v1\/stripe-webhook 500/ })
    )
    expect(screen.getByText(/"function_id": "stripe-webhook"/)).toBeInTheDocument()
  })

  it('shows an empty state when nothing matched', async () => {
    mswServer.use(http.get(EVENTS_URL, () => HttpResponse.json(events(0))))

    customRender(<AlertIssueLogEvents projectRef="default" alertIssueId="a1" />)

    expect(await screen.findByText('No log events in this time range')).toBeInTheDocument()
  })

  it('explains when the alert issue type has no log preview', async () => {
    mswServer.use(
      http.get(EVENTS_URL, () =>
        HttpResponse.json({ error: { message: 'no preview' } }, { status: 422 })
      )
    )

    customRender(<AlertIssueLogEvents projectRef="default" alertIssueId="a1" />)

    expect(await screen.findByText('This alert issue type has no log preview.')).toBeInTheDocument()
  })
})
