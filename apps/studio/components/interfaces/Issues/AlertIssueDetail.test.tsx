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

  it('shows the advisor detail and remediation link from metadata', () => {
    customRender(
      <AlertIssueDetailView
        issue={{
          ...issue,
          metadata: {
            detail: 'Table public.orders is public, but RLS has not been enabled.',
            remediation:
              'https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public',
          },
        }}
        onAction={vi.fn()}
      />
    )

    expect(
      screen.getByText('Table public.orders is public, but RLS has not been enabled.')
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View remediation' })).toHaveAttribute(
      'href',
      'https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public'
    )
  })

  it('renders the description as markdown with the investigation right after it', () => {
    customRender(
      <AlertIssueDetailView
        issue={{ ...issue, description: 'Table `public.orders` is public.' }}
        onAction={vi.fn()}
        investigation={<section aria-label="Investigate" />}
      />
    )

    const description = screen.getByRole('region', { name: 'Description' })
    expect(description.querySelector('code')).toHaveTextContent('public.orders')
    expect(description.nextElementSibling).toHaveAttribute('aria-label', 'Investigate')
  })

  it('renders extra sections passed as children', () => {
    customRender(
      <AlertIssueDetailView issue={issue} onAction={vi.fn()}>
        <section aria-label="Comments">comments</section>
      </AlertIssueDetailView>
    )

    expect(screen.getByRole('region', { name: 'Comments' })).toBeInTheDocument()
  })
})
