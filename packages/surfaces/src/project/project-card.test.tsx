import { act, cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { renderWithTooltip as render, testProject } from '../test-utils'
import { formatElapsed, ProjectCard } from './project-card'

afterEach(cleanup)

const starting = { ...testProject, status: 'COMING_UP' }

describe('ProjectCard', () => {
  it('shows where the project is and that it is ready', () => {
    render(<ProjectCard project={testProject} organizationName="Acme Inc" />)
    expect(screen.getByRole('heading', { name: 'Customer portal' })).toBeTruthy()
    expect(screen.getByText('Acme Inc')).toBeTruthy()
    expect(screen.getByText('project-ref')).toBeTruthy()
    expect(screen.getByText('eu-west-1')).toBeTruthy()
    expect(screen.getByText('Active')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('Status: Active')
  })

  it('announces when a starting project becomes ready, so the user need not refresh', () => {
    const { rerender } = render(<ProjectCard project={starting} isFollowing />)
    expect(screen.getByText('Starting')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('Status: Starting')
    rerender(<ProjectCard project={testProject} isFollowing />)
    expect(screen.getByRole('status').textContent).toBe('Status: Active')
  })

  it('shows a failed check as the status, until a check succeeds', () => {
    const onRefresh = vi.fn()
    const { rerender } = render(
      <ProjectCard project={starting} error="Network error" onRefresh={onRefresh} />
    )
    // The last status read may no longer be true, so it is not shown.
    expect(screen.queryByText('Starting')).toBeNull()
    expect(screen.getByText('Check failed')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('Failed to check status: Network error')
    fireEvent.click(screen.getByRole('button', { name: 'Refresh status' }))
    expect(onRefresh).toHaveBeenCalled()
    rerender(<ProjectCard project={testProject} onRefresh={onRefresh} />)
    expect(screen.getByText('Active')).toBeTruthy()
  })

  it('puts Refresh beside Open in dashboard', () => {
    render(<ProjectCard project={testProject} onRefresh={() => {}} onOpenDashboard={() => {}} />)
    // Refresh is an icon; its name comes from its label.
    expect(
      screen
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label') ?? button.textContent?.trim())
    ).toEqual(['Refresh status', 'Open in dashboard'])
  })

  it('hides actions the host cannot perform', () => {
    render(<ProjectCard project={testProject} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('shows how long a new project has been setting up, and stops once it is ready', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-13T12:01:12Z'))
    try {
      const created = { ...starting, created_at: '2026-11-13T12:00:00Z' }
      const { rerender } = render(<ProjectCard project={created} isFollowing />)
      expect(screen.getByText('Started 1m 12s ago')).toBeTruthy()
      act(() => vi.advanceTimersByTime(3000))
      expect(screen.getByText('Started 1m 15s ago')).toBeTruthy()
      rerender(<ProjectCard project={{ ...created, status: 'ACTIVE_HEALTHY' }} isFollowing />)
      expect(screen.queryByText(/^Started/)).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('formats elapsed time compactly', () => {
    expect(formatElapsed(9_000)).toBe('9s')
    expect(formatElapsed(72_000)).toBe('1m 12s')
    expect(formatElapsed(3_780_000)).toBe('1h 3m')
  })

  it('leaves out the organization until its name is known, rather than showing a slug', () => {
    render(<ProjectCard project={testProject} />)
    expect(screen.queryByText('acme')).toBeNull()
  })
})
