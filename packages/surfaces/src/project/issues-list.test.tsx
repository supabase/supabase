import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AskAgent } from '../common'
import { renderWithTooltip, testProject } from '../test-utils'
import { IssuesList, type ProjectIssues } from './issues-list'

afterEach(cleanup)

const issues: ProjectIssues = {
  security: {
    status: 'ready',
    data: {
      total: 2,
      truncated: false,
      issues: [{ name: 'rls_disabled_in_public', title: 'RLS disabled', level: 'ERROR', count: 2 }],
    },
  },
  performance: { status: 'unavailable', message: 'Performance Advisor needs a newer plan.' },
}

describe('IssuesList', () => {
  it('works on its own: sends a finding to the agent and confirms it reached chat', async () => {
    const onAsk = vi.fn<AskAgent>(async () => {})
    renderWithTooltip(
      <IssuesList
        project={testProject}
        issues={{ status: 'success', data: issues }}
        onAsk={onAsk}
      />
    )
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Review RLS disabled' }))
    })
    expect(onAsk).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'review-finding', category: 'security' })
    )
    expect(screen.getByText('Sent to chat.')).toBeTruthy()
  })

  it('shows a category that failed to load as unavailable, never as clear', () => {
    renderWithTooltip(
      <IssuesList project={testProject} issues={{ status: 'success', data: issues }} />
    )
    expect(screen.getByText('Performance Advisor needs a newer plan.')).toBeTruthy()
    expect(screen.queryByText('No performance issues')).toBeNull()
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Review RLS disabled' }).disabled
    ).toBe(true)
  })
})
