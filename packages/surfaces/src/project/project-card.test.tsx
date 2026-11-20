import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { renderWithTooltip as render } from '../test-utils'
import { ProjectCard } from './project-card'

afterEach(cleanup)

const details = [
  { label: 'Project ref', value: 'project-ref' },
  { label: 'Region', value: 'eu-west-1' },
]

describe('ProjectCard', () => {
  it('shows where the project is and its status', () => {
    render(
      <ProjectCard
        breadcrumbs={['Acme Inc']}
        name="Customer portal"
        badge={{ label: 'Active', tone: 'success' }}
        details={details}
      />
    )
    expect(screen.getByRole('region', { name: 'Customer portal' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Customer portal' })).toBeTruthy()
    expect(screen.getByText('Acme Inc')).toBeTruthy()
    expect(screen.getByText('project-ref')).toBeTruthy()
    expect(screen.getByText('eu-west-1')).toBeTruthy()
    expect(screen.getByText('Active')).toBeTruthy()
  })

  it('names a branch under its organization and project', () => {
    render(
      <ProjectCard
        breadcrumbs={['Acme Inc', 'Customer portal']}
        name="develop"
        badge={{ label: 'Running migrations', isSpinning: true }}
        details={[{ label: 'Branch project ref', value: 'branch-ref' }]}
      />
    )
    expect(screen.getByText(/Acme Inc/).textContent).toBe('Acme Inc/Customer portal')
    expect(screen.getByText('Running migrations')).toBeTruthy()
  })

  it('keeps its layout while loading, with nothing to act on yet', () => {
    render(<ProjectCard isLoading details={[{ label: 'Project ref' }, { label: 'Region' }]} />)
    const card = screen.getByRole('region', { name: 'Loading' })
    expect(card.getAttribute('aria-busy')).toBe('true')
    expect(screen.queryByRole('heading')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    // Both details keep their place, read by their labels.
    expect(screen.getByText('Project ref')).toBeTruthy()
    expect(screen.getByText('Region')).toBeTruthy()
  })

  it('shows what is already known while loading', () => {
    render(
      <ProjectCard
        isLoading
        name="Customer portal"
        details={[{ label: 'Project ref' }, { label: 'Region', value: 'eu-west-1' }]}
      />
    )
    expect(screen.getByRole('heading', { name: 'Customer portal' })).toBeTruthy()
    expect(screen.getByText('eu-west-1')).toBeTruthy()
  })

  it('explains a problem under the details', () => {
    render(
      <ProjectCard
        name="Customer portal"
        badge={{ label: 'Failed', tone: 'danger' }}
        note={{ tone: 'danger', text: 'Failed while creating (INIT_FAILED).' }}
        details={details}
      />
    )
    expect(screen.getByText('Failed')).toBeTruthy()
    expect(screen.getByText('Failed while creating (INIT_FAILED).')).toBeTruthy()
  })

  it('offers Retry only when the host passes it, and reports the click', () => {
    const onRetry = vi.fn()
    const { rerender } = render(
      <ProjectCard name="Customer portal" badge={{ label: 'Check failed' }} details={details} />
    )
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull()
    rerender(
      <ProjectCard
        name="Customer portal"
        badge={{ label: 'Check failed' }}
        details={details}
        onRetry={onRetry}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('is busy and cannot be retried again while a retry is in flight', () => {
    render(
      <ProjectCard
        name="Customer portal"
        badge={{ label: 'Check failed' }}
        details={details}
        onRetry={() => {}}
        isRetrying
      />
    )
    expect(screen.getByRole('region').getAttribute('aria-busy')).toBe('true')
    expect(screen.getByRole('button', { name: 'Retry' })).toHaveProperty('disabled', true)
  })

  it('opens the dashboard when the host can', () => {
    const onOpenDashboard = vi.fn()
    const { rerender } = render(<ProjectCard name="Customer portal" details={details} />)
    expect(screen.queryByRole('button', { name: 'Open in dashboard' })).toBeNull()
    rerender(
      <ProjectCard name="Customer portal" details={details} onOpenDashboard={onOpenDashboard} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open in dashboard' }))
    expect(onOpenDashboard).toHaveBeenCalled()
  })

  it('renders what the host puts along its bottom edge', () => {
    render(
      <ProjectCard name="Customer portal" details={details}>
        <p>Connection details</p>
      </ProjectCard>
    )
    expect(screen.getByText('Connection details')).toBeTruthy()
  })
})
