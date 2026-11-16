import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { IssuesSidebar } from './IssuesSidebar'
import type { Lint } from '@/data/lint/lint-query'
import { API_URL } from '@/lib/constants'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

const lint: Lint = {
  name: 'rls_disabled_in_public',
  title: 'RLS disabled',
  level: 'ERROR',
  facing: 'EXTERNAL',
  categories: ['SECURITY'],
  description: 'Row level security is disabled',
  detail: 'Enable row level security on public.accounts',
  remediation: 'https://supabase.com/docs/guides/database/postgres/row-level-security',
  metadata: { type: 'table', schema: 'public', name: 'accounts' },
  cache_key: 'accounts-rls',
}

const ALERT_ISSUES_URL = `${API_URL}/platform/projects/:ref/alerts/issues`

const alertIssue = {
  alert_issue_id: 'a1',
  status: 'open',
  change: 'opened',
  title: 'Edge function errors',
  severity: 'major',
  category: 'performance',
  identifiers: { project: 'default' },
  metadata: {},
  signal_count: 1,
  first_seen_at: '2026-11-16T10:00:00Z',
  last_seen_at: '2026-11-16T10:00:00Z',
  attention_at: '2026-11-16T10:00:00Z',
  actor: 'system',
  unread: true,
}

describe('IssuesSidebar', () => {
  it('lists active alert issues and marks one read when opened', async () => {
    mockProjectGrantContext({ ref: 'default' })
    addAPIMock({ method: 'get', path: '/platform/projects/:ref/run-lints', response: [] })
    let readBody: unknown
    mswServer.use(
      http.get(ALERT_ISSUES_URL, () =>
        HttpResponse.json([
          alertIssue,
          { ...alertIssue, alert_issue_id: 'a2', title: 'Old outage', status: 'resolved' },
        ])
      ),
      http.post(`${ALERT_ISSUES_URL}/reads`, async ({ request }) => {
        readBody = await request.json()
        return HttpResponse.json({ count: 1 })
      })
    )
    const user = userEvent.setup()
    customRender(<IssuesSidebar />)

    const link = await screen.findByRole('link', { name: /Edge function errors/i })
    expect(link).toHaveAttribute('href', '/project/default/issues/alerts/a1')
    expect(screen.queryByRole('link', { name: /Old outage/i })).not.toBeInTheDocument()

    await user.click(link)
    await waitFor(() => expect(readBody).toEqual({ alert_issue_ids: ['a1'], read: true }))
    expect(screen.queryByText('No open issues')).not.toBeInTheDocument()
  })

  it('searches, preserves filters in links, and clears an empty filtered list', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mswServer.use(http.get(ALERT_ISSUES_URL, () => HttpResponse.json([])))
    addAPIMock({ method: 'get', path: '/platform/projects/:ref/run-lints', response: [lint] })
    const user = userEvent.setup()
    customRender(<IssuesSidebar />, { nuqs: { searchParams: '?category=security' } })
    const link = await screen.findByRole('link', { name: /RLS disabled/i })
    expect(link).toHaveAttribute(
      'href',
      '/project/default/issues/rls_disabled_in_public?category=security'
    )
    const search = screen.getByRole('textbox', { name: 'Search issues' })
    await user.click(search)
    await user.paste('accounts')
    await waitFor(() =>
      expect(link).toHaveAttribute(
        'href',
        '/project/default/issues/rls_disabled_in_public?category=security&q=accounts'
      )
    )
    await user.keyboard('{Escape}')
    expect(search).toHaveValue('')
    expect(search).toHaveFocus()
    await user.paste('missing table')
    expect(await screen.findByText('No issues match these filters')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(await screen.findByRole('link', { name: /RLS disabled/i })).toHaveAttribute(
      'href',
      '/project/default/issues/rls_disabled_in_public'
    )
    expect(search).toHaveValue('')
  })

  it('opens the alert issue types from the filter menu', async () => {
    mockProjectGrantContext({ ref: 'default' })
    addAPIMock({ method: 'get', path: '/platform/projects/:ref/run-lints', response: [] })
    mswServer.use(
      http.get(ALERT_ISSUES_URL, () => HttpResponse.json([])),
      http.get(`${API_URL}/platform/projects/:ref/alerts/issue-types`, () => HttpResponse.json([]))
    )

    customRender(<IssuesSidebar />)

    await userEvent.click(screen.getByRole('button', { name: 'Filters' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Manage alert issue types' }))

    expect(await screen.findByRole('dialog', { name: 'Alert issue types' })).toBeInTheDocument()
    expect(await screen.findByText('No alert issue types yet')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'New log rule' }))
    expect(await screen.findByRole('dialog', { name: 'New log rule' })).toBeInTheDocument()
  })
})
