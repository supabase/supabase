import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AlertIssueNotebook } from './AlertIssueNotebook'
import type { AlertIssue } from '@/data/alert-issues/alert-issue.schema'
import { customRender } from '@/tests/lib/custom-render'

const testContext = vi.hoisted(() => ({ createNotebook: vi.fn() }))

vi.mock('@/components/interfaces/Explorer/hooks', () => ({
  useCreateNotebook: () => ({ createNotebook: testContext.createNotebook }),
}))

vi.mock('./AlertIssueQueryCell', () => ({
  AlertIssueQueryCell: ({ cell }: { cell: { title: string; sql: string } }) => (
    <figure aria-label={cell.title}>{cell.sql}</figure>
  ),
}))

const issue: AlertIssue = {
  alert_issue_id: 'a1',
  status: 'open',
  change: 'opened',
  title: 'RLS Disabled in Public: public.orders',
  severity: 'critical',
  category: 'security',
  identifiers: { project: 'default', schema: 'public', table: 'orders' },
  metadata: {},
  signal_count: 1,
  first_seen_at: '2026-11-16T10:00:00Z',
  last_seen_at: '2026-11-16T10:00:00Z',
  attention_at: '2026-11-16T10:00:00Z',
  actor: 'system',
  notebook: [
    {
      title: 'Exposed rows',
      source: 'database',
      sql: 'select count(*) from {{ident:schema}}.{{ident:table}};',
    },
    { title: 'Function settings', source: 'database', sql: 'select {{literal:function}};' },
  ],
}

describe('AlertIssueNotebook', () => {
  it('renders runnable cells from the rule templates and flags the ones that cannot run', () => {
    customRender(<AlertIssueNotebook issue={issue} projectRef="default" />)

    expect(screen.getByRole('figure', { name: 'Exposed rows' })).toHaveTextContent(
      'select count(*) from public.orders;'
    )
    expect(screen.getByText("Function settings can't run")).toBeInTheDocument()
    expect(screen.getByText('This alert issue has no "function" identifier.')).toBeInTheDocument()
  })

  it('opens the alert issue as a notebook', async () => {
    customRender(<AlertIssueNotebook issue={issue} projectRef="default" />)

    await userEvent.click(screen.getByRole('button', { name: 'Open as notebook' }))

    expect(testContext.createNotebook).toHaveBeenCalledTimes(1)
    const [{ name, cells }] = testContext.createNotebook.mock.calls[0]
    expect(name).toBe(issue.title)
    expect(cells.map((cell: { _tag: string }) => cell._tag)).toEqual([
      'markdown_cell',
      'database_cell',
    ])
    expect(cells[0].text).toContain('/project/default/issues/alerts/a1')
  })

  it('renders nothing when the rule has no templates', () => {
    const { container } = customRender(
      <AlertIssueNotebook issue={{ ...issue, notebook: [] }} projectRef="default" />
    )

    expect(container).toBeEmptyDOMElement()
  })
})
