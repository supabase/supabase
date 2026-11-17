import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LOCAL_STORAGE_KEYS } from 'common'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { AlertIssueAskAssistant } from './AlertIssueAskAssistant'
import { AlertIssueAssistantProvider } from './AlertIssueAssistantProvider'
import { AlertIssueComments } from './AlertIssueComments'
import type { AlertIssue } from '@/data/alert-issues/alert-issue.schema'
import { API_URL } from '@/lib/constants'
import { customRender } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

const ISSUE_URL = `${API_URL}/platform/projects/:ref/alerts/issues/:alertIssueId`

const issue: AlertIssue = {
  alert_issue_id: 'e1',
  status: 'open',
  change: 'opened',
  title: 'Edge Function errors: stripe-webhook',
  severity: 'major',
  category: 'health',
  rule_key: 'supabase.edge-function-5xx',
  identifiers: { project: 'default', function_id: 'stripe-webhook' },
  metadata: {},
  signal_count: 1,
  first_seen_at: '2026-11-16T10:00:00Z',
  last_seen_at: '2026-11-16T10:00:00Z',
  attention_at: '2026-11-16T10:00:00Z',
  actor: 'system',
  notebook: [],
}

const event = (status_code: number, index: number) => ({
  id: `${index}`,
  timestamp: '2026-11-16T10:00:00Z',
  event_message: `POST | ${status_code}`,
  body: { metadata: { status_code } },
})

const mockApi = () => {
  const posted: { body: string; as_assistant?: boolean }[] = []
  mswServer.use(
    http.get(`${API_URL}/platform/projects/:ref`, () =>
      HttpResponse.json({ id: 1, ref: 'default', name: 'Default Project', connectionString: '' })
    ),
    http.get(`${ISSUE_URL}/comments`, () => HttpResponse.json([])),
    http.post(`${ISSUE_URL}/comments`, async ({ request }) => {
      const payload = (await request.json()) as { body: string; as_assistant?: boolean }
      posted.push(payload)
      return HttpResponse.json(
        {
          comment_id: `c${posted.length}`,
          alert_issue_id: 'e1',
          author: payload.as_assistant ? 'Supabase Assistant' : 'self-hosted',
          body: payload.body,
          created_at: '2026-11-16T10:05:00Z',
        },
        { status: 201 }
      )
    }),
    http.get(`${ISSUE_URL}/events`, () =>
      HttpResponse.json({
        lql: 'f:function_edge_logs',
        from: '2026-11-15T10:00:00Z',
        to: '2026-11-16T10:00:00Z',
        total: 3,
        buckets: [],
        events: [event(500, 1), event(500, 2), event(504, 3)],
      })
    )
  )
  return posted
}

const renderThread = (stepDelayMs = 0) =>
  customRender(
    <AlertIssueAssistantProvider
      projectRef="default"
      issue={issue}
      stepDelayMs={stepDelayMs}
      wordDelayMs={0}
    >
      <AlertIssueAskAssistant context={{ kind: 'log_events', label: 'the log events' }}>
        <section aria-label="Log events">events</section>
      </AlertIssueAskAssistant>
      <AlertIssueComments projectRef="default" alertIssueId="e1" />
    </AlertIssueAssistantProvider>
  )

const showOutOfScope = () =>
  localStorage.setItem(LOCAL_STORAGE_KEYS.ALERT_ISSUES_OUT_OF_SCOPE_VISIBLE, 'true')

afterEach(() => localStorage.removeItem(LOCAL_STORAGE_KEYS.ALERT_ISSUES_OUT_OF_SCOPE_VISIBLE))

describe('AlertIssueAskAssistant with out-of-scope features hidden', () => {
  it('shows no Ask Assistant button', () => {
    mockApi()
    renderThread()

    expect(screen.getByRole('region', { name: 'Log events' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ask Assistant' })).not.toBeInTheDocument()
  })

  it('posts an @assistant mention as a plain comment', async () => {
    const posted = mockApi()
    renderThread()

    const comment = await screen.findByRole('textbox', { name: 'Add a comment' })
    await userEvent.type(comment, '@assistant what changed?')
    fireEvent.submit(comment.closest('form')!)

    await waitFor(() => expect(posted).toHaveLength(1))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(posted).toHaveLength(1)
    expect(
      screen.queryByRole('listitem', { name: 'Supabase Assistant is responding' })
    ).not.toBeInTheDocument()
  })
})

describe('AlertIssueAskAssistant', () => {
  beforeEach(showOutOfScope)

  it('renders only the block outside an alert issue assistant', () => {
    customRender(
      <AlertIssueAskAssistant context={{ kind: 'finding', label: 'the finding' }}>
        <p>Finding</p>
      </AlertIssueAskAssistant>
    )

    expect(screen.getByText('Finding')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ask Assistant' })).not.toBeInTheDocument()
  })

  it('posts an @assistant comment, runs the steps and posts the reply', async () => {
    const posted = mockApi()
    renderThread()

    await userEvent.click(await screen.findByRole('button', { name: 'Ask Assistant' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Investigate further' }))

    await waitFor(() => expect(posted).toHaveLength(2))
    expect(posted[0]).toEqual({ body: '@assistant Investigate further\n\nOn: log events' })
    expect(posted[1].as_assistant).toBe(true)
    expect(posted[1].body).toContain('_Read 3 log events_')
    expect(posted[1].body).toContain('**3 failed requests**')

    expect(await screen.findByText('Assistant')).toBeInTheDocument()
    expect(screen.getByText('@assistant')).toBeInTheDocument()
  })

  it('shows the steps while the assistant works', async () => {
    mockApi()
    renderThread(200)

    await userEvent.click(await screen.findByRole('button', { name: 'Ask Assistant' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Explain this' }))

    const steps = await screen.findByRole('list', { name: 'Assistant steps' })
    expect(steps).toHaveTextContent('Reading the finding')
    expect(steps).toHaveTextContent('Reading log events from the last 24 hours')
    expect(
      screen.getByRole('listitem', { name: 'Supabase Assistant is responding' })
    ).toBeInTheDocument()
  })

  it('asks a typed question from the popover', async () => {
    const posted = mockApi()
    renderThread()

    await userEvent.click(await screen.findByRole('button', { name: 'Ask Assistant' }))
    const question = await screen.findByRole('textbox', { name: 'Ask the Assistant' })
    await userEvent.type(question, 'Why only stripe-webhook?')
    fireEvent.submit(question.closest('form')!)

    await waitFor(() =>
      expect(posted[0]).toEqual({ body: '@assistant Why only stripe-webhook?\n\nOn: log events' })
    )
  })

  it('starts the assistant from a comment that mentions it', async () => {
    const posted = mockApi()
    renderThread()

    const comment = await screen.findByRole('textbox', { name: 'Add a comment' })
    await userEvent.type(comment, '@assistant what changed?')
    fireEvent.submit(comment.closest('form')!)

    await waitFor(() => expect(posted).toHaveLength(2))
    expect(posted[1].as_assistant).toBe(true)
  })

  it('does not start the assistant for other comments', async () => {
    const posted = mockApi()
    renderThread()

    const comment = await screen.findByRole('textbox', { name: 'Add a comment' })
    await userEvent.type(comment, 'Deploying a fix')
    fireEvent.submit(comment.closest('form')!)

    await waitFor(() => expect(posted).toHaveLength(1))
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(posted).toHaveLength(1)
  })
})
