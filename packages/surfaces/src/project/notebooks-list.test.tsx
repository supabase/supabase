import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AskAgent } from '../common'
import { renderWithTooltip, testProject } from '../test-utils'
import { NotebooksList } from './notebooks-list'

afterEach(cleanup)

const notebook = {
  id: 'nb-1',
  name: 'Weekly signups',
  description: null,
  favorite: false,
  updated_at: '2026-11-10T00:00:00Z',
}

describe('NotebooksList', () => {
  it('asks the agent to run a notebook by id instead of running its SQL itself', async () => {
    const onAsk = vi.fn<AskAgent>(async () => {})
    renderWithTooltip(
      <NotebooksList
        project={testProject}
        notebooks={{ status: 'success', data: [notebook] }}
        onAsk={onAsk}
      />
    )
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Run Weekly signups' }))
    })
    expect(onAsk).toHaveBeenCalledWith({
      type: 'run-notebook',
      project: testProject,
      notebook: { id: 'nb-1', name: 'Weekly signups' },
    })
    expect(screen.getByText('Sent to chat.')).toBeTruthy()
  })

  it('says when a project has no notebooks, and disables Run on hosts without an agent', () => {
    const { rerender } = renderWithTooltip(
      <NotebooksList project={testProject} notebooks={{ status: 'success', data: [] }} />
    )
    expect(screen.getByText('No notebooks yet')).toBeTruthy()
    rerender(
      <NotebooksList project={testProject} notebooks={{ status: 'success', data: [notebook] }} />
    )
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Run Weekly signups' }).disabled
    ).toBe(true)
  })
})
