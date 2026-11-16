import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { AlertIssueTypesDialog } from './AlertIssueTypesDialog'
import { API_URL } from '@/lib/constants'
import { customRender } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

const ALERTS = `${API_URL}/platform/projects/:ref/alerts`

const type = (overrides: Record<string, unknown>) => ({
  rule_key: 'supabase.advisors.security',
  name: 'Security advisor',
  description: 'Security lints from the database advisor.',
  category: 'security',
  severity: 'critical',
  managed: true,
  language: 'pg_sql',
  lql: null,
  group_by: [],
  silenced: false,
  silence_id: null,
  ...overrides,
})

const TYPES = [
  type({}),
  type({
    rule_key: 'logflare.edge-fn-5xx',
    name: 'Edge Function errors',
    description: 'An Edge Function returned 5xx responses.',
    category: 'performance',
    silenced: true,
    silence_id: 's1',
  }),
  type({
    rule_key: 'custom.stripe-errors',
    name: 'Stripe webhook errors',
    description: null,
    category: 'health',
    managed: false,
    language: 'lql',
    lql: 'f:function_edge_logs m.function_id:stripe-webhook',
  }),
]

const renderDialog = () =>
  customRender(
    <AlertIssueTypesDialog
      projectRef="default"
      open
      onOpenChange={vi.fn()}
      onCreateRule={vi.fn()}
    />
  )

describe('AlertIssueTypesDialog', () => {
  it('lists alert issue types by category with their state for the project', async () => {
    mswServer.use(http.get(`${ALERTS}/issue-types`, () => HttpResponse.json(TYPES)))

    renderDialog()

    const security = await screen.findByRole('group', { name: 'Security' })
    expect(within(security).getByText('Security advisor')).toBeInTheDocument()
    expect(
      screen.getByRole('switch', { name: 'Create Security advisor alert issues' })
    ).toBeChecked()
    expect(
      screen.getByRole('switch', { name: 'Create Edge Function errors alert issues' })
    ).not.toBeChecked()
    expect(
      within(screen.getByRole('group', { name: 'Health' })).getByText('Custom')
    ).toBeInTheDocument()
  })

  it('silences an alert issue type for the project', async () => {
    let silenced: unknown
    mswServer.use(
      http.get(`${ALERTS}/issue-types`, () => HttpResponse.json(TYPES)),
      http.post(`${ALERTS}/silences`, async ({ request }) => {
        silenced = await request.json()
        return HttpResponse.json({ id: 's2' }, { status: 201 })
      }),
      http.get(`${ALERTS}/issues`, () => HttpResponse.json([]))
    )

    renderDialog()

    const toggle = await screen.findByRole('switch', {
      name: 'Create Security advisor alert issues',
    })
    await userEvent.click(toggle)

    await waitFor(() => expect(silenced).toEqual({ rule_key: 'supabase.advisors.security' }))
    await waitFor(() => expect(toggle).not.toBeChecked())
  })

  it('re-enables a silenced alert issue type', async () => {
    let deleted: unknown
    mswServer.use(
      http.get(`${ALERTS}/issue-types`, () => HttpResponse.json(TYPES)),
      http.delete(`${ALERTS}/silences/:silenceId`, ({ params }) => {
        deleted = params.silenceId
        return HttpResponse.json({ id: params.silenceId })
      }),
      http.get(`${ALERTS}/issues`, () => HttpResponse.json([]))
    )

    renderDialog()

    await userEvent.click(
      await screen.findByRole('switch', { name: 'Create Edge Function errors alert issues' })
    )

    await waitFor(() => expect(deleted).toBe('s1'))
  })

  it('deletes a custom log rule', async () => {
    let deleted: unknown
    mswServer.use(
      http.get(`${ALERTS}/issue-types`, () => HttpResponse.json(TYPES)),
      http.delete(`${ALERTS}/issue-types/:ruleKey`, ({ params }) => {
        deleted = params.ruleKey
        return HttpResponse.json({ rule_key: params.ruleKey })
      }),
      http.get(`${ALERTS}/issues`, () => HttpResponse.json([]))
    )

    renderDialog()

    expect(
      screen.queryByRole('button', { name: 'Delete Security advisor' })
    ).not.toBeInTheDocument()
    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete Stripe webhook errors' })
    )

    await waitFor(() => expect(deleted).toBe('custom.stripe-errors'))
  })
})
