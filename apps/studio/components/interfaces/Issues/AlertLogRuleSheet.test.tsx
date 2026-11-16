import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { AlertLogRuleSheet } from './AlertLogRuleSheet'
import { API_URL } from '@/lib/constants'
import { customRender } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

const ALERTS = `${API_URL}/platform/projects/:ref/alerts`

const PREVIEW = {
  lql: 'f:function_edge_logs m.status:>=500',
  source: 'function_edge_logs',
  from: '2026-11-16T11:00:00Z',
  to: '2026-11-16T12:00:00Z',
  total: 3,
  buckets: [],
  events: [
    {
      id: 'e1',
      timestamp: '2026-11-16T11:30:00Z',
      event_message: 'POST /functions/v1/stripe-webhook 500',
      body: {},
    },
  ],
}

// jsdom doesn't submit a form from an external submit button, like the other Studio form tests.
const submitForm = () =>
  fireEvent.submit(
    document.getElementById(
      screen.getByRole('button', { name: 'Create log rule' }).getAttribute('form')!
    )!
  )

describe('AlertLogRuleSheet', () => {
  it('tests the filter against the last hour of logs', async () => {
    let previewed: unknown
    mswServer.use(
      http.post(`${ALERTS}/preview`, async ({ request }) => {
        previewed = await request.json()
        return HttpResponse.json(PREVIEW)
      })
    )

    customRender(<AlertLogRuleSheet projectRef="default" open onClose={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('LQL filter'), 'm.status:>=500')
    await userEvent.click(screen.getByRole('button', { name: 'Test filter' }))

    expect(await screen.findByText('3 matching events in the last hour')).toBeInTheDocument()
    expect(screen.getByText('POST /functions/v1/stripe-webhook 500')).toBeInTheDocument()
    expect(previewed).toMatchObject({ lql: 'f:function_edge_logs m.status:>=500' })
  })

  it('creates a scheduled log rule for the project', async () => {
    let created: unknown
    const onClose = vi.fn()
    mswServer.use(
      http.post(`${ALERTS}/issue-types`, async ({ request }) => {
        created = await request.json()
        return HttpResponse.json(
          {
            rule_key: 'custom.stripe-webhook-errors',
            name: 'Stripe webhook errors',
            category: 'health',
            severity: 'warning',
            managed: false,
            silenced: false,
          },
          { status: 201 }
        )
      })
    )

    customRender(<AlertLogRuleSheet projectRef="default" open onClose={onClose} />)

    await userEvent.type(screen.getByLabelText('Name'), 'Stripe webhook errors')
    await userEvent.type(
      screen.getByLabelText('LQL filter'),
      'm.function_id:stripe-webhook m.status:>=500'
    )
    await userEvent.type(screen.getByLabelText('Group by'), 'metadata.function_id')
    submitForm()

    await waitFor(() =>
      expect(created).toEqual({
        name: 'Stripe webhook errors',
        lql: 'f:function_edge_logs m.function_id:stripe-webhook m.status:>=500',
        severity: 'warning',
        category: 'health',
        group_by: ['metadata.function_id'],
      })
    )
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('requires a name and a filter', async () => {
    const onCreate = vi.fn()
    mswServer.use(http.post(`${ALERTS}/issue-types`, onCreate))

    customRender(<AlertLogRuleSheet projectRef="default" open onClose={vi.fn()} />)

    submitForm()

    expect(await screen.findByText('Enter a name')).toBeInTheDocument()
    expect(screen.getByText('Enter an LQL filter')).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
  })
})
