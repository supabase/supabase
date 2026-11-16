import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AlertIssueDetailView } from './AlertIssueDetail'
import type { AlertIssue } from '@/data/alert-issues/alert-issue.schema'
import { customRender } from '@/tests/lib/custom-render'

const issue: AlertIssue = {
  alert_issue_id: 'a1',
  status: 'open',
  change: 'opened',
  title: 'Edge function errors: stripe-webhook',
  description: 'More than 5% of requests failed.',
  severity: 'major',
  category: 'performance',
  rule_key: 'logflare.edge-fn-5xx',
  identifiers: { project: 'default', function_id: 'stripe-webhook' },
  metadata: { row_count: 3 },
  signal_count: 3,
  first_seen_at: '2026-11-16T10:00:00Z',
  last_seen_at: '2026-11-16T10:10:00Z',
  attention_at: '2026-11-16T10:00:00Z',
  actor: 'system',
}

describe('AlertIssueDetailView', () => {
  it('shows the alert issue report, identifiers and metadata', () => {
    customRender(<AlertIssueDetailView issue={issue} onAction={vi.fn()} />)

    expect(screen.getByRole('heading', { name: issue.title })).toBeInTheDocument()
    expect(screen.getByText('More than 5% of requests failed.')).toBeInTheDocument()
    expect(screen.getByText('function_id')).toBeInTheDocument()
    expect(screen.getByText('stripe-webhook')).toBeInTheDocument()
    expect(screen.getByText(/"row_count": 3/)).toBeInTheDocument()
  })

  it('offers the actions for an open alert issue', async () => {
    const onAction = vi.fn()
    customRender(<AlertIssueDetailView issue={issue} onAction={onAction} />)

    await userEvent.click(screen.getByRole('button', { name: 'Acknowledge' }))
    expect(onAction).toHaveBeenCalledWith('acknowledge')
    expect(screen.queryByRole('button', { name: 'Reopen' })).not.toBeInTheDocument()
  })

  it('offers reopen for a resolved alert issue', async () => {
    const onAction = vi.fn()
    customRender(
      <AlertIssueDetailView issue={{ ...issue, status: 'resolved' }} onAction={onAction} />
    )

    expect(screen.queryByRole('button', { name: 'Acknowledge' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reopen' }))
    expect(onAction).toHaveBeenCalledWith('reopen')
  })

  it('disables actions while one is pending', () => {
    customRender(<AlertIssueDetailView issue={issue} onAction={vi.fn()} isUpdating />)

    expect(screen.getByRole('button', { name: 'Resolve' })).toBeDisabled()
  })
})
