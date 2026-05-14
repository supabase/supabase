import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Project } from './Project'

const { mockUseIsFeatureEnabled, mockUseProjectPauseStatusQuery, mockUseSelectedProjectQuery } =
  vi.hoisted(() => ({
    mockUseIsFeatureEnabled: vi.fn(),
    mockUseProjectPauseStatusQuery: vi.fn(),
    mockUseSelectedProjectQuery: vi.fn(),
  }))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('ui', () => ({
  Button: ({
    children,
    asChild,
    type: _type,
    ...props
  }: {
    children: ReactNode
    asChild?: boolean
    type?: string
  }) => (asChild ? <>{children}</> : <button {...props}>{children}</button>),
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('ui-patterns/PageSection', () => ({
  PageSection: ({ children, id }: { children: ReactNode; id?: string }) => (
    <section id={id}>{children}</section>
  ),
  PageSectionContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageSectionDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  PageSectionMeta: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageSectionSummary: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageSectionTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}))

vi.mock('@/components/interfaces/Project/ResumeProjectButton', () => ({
  ResumeProjectButton: () => <div>ResumeProjectButton</div>,
}))

vi.mock('./Infrastructure/PauseProjectButton', () => ({
  default: () => <div>PauseProjectButton</div>,
}))

vi.mock('./Infrastructure/RestartServerButton', () => ({
  default: () => <div>RestartServerButton</div>,
}))

vi.mock('@/data/projects/project-pause-status-query', () => ({
  useProjectPauseStatusQuery: mockUseProjectPauseStatusQuery,
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mockUseIsFeatureEnabled,
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: mockUseSelectedProjectQuery,
}))

describe('Project settings availability', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseIsFeatureEnabled.mockReturnValue({
      projectSettingsRestartProject: true,
    })

    mockUseProjectPauseStatusQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isSuccess: false,
    })
  })

  it('shows the restart action for active projects', () => {
    mockUseSelectedProjectQuery.mockReturnValue({
      data: {
        parent_project_ref: null,
        ref: 'active-project',
        status: 'ACTIVE_HEALTHY',
      },
    })

    render(<Project />)

    expect(screen.getByText('Restart project')).toBeInTheDocument()
    expect(screen.getByText('RestartServerButton')).toBeInTheDocument()
    expect(screen.getByText('Pause project')).toBeInTheDocument()
    expect(screen.getByText('PauseProjectButton')).toBeInTheDocument()
    expect(screen.queryByText('ResumeProjectButton')).not.toBeInTheDocument()
  })

  it('shows the shared resume action for paused projects that can still be restored', () => {
    mockUseSelectedProjectQuery.mockReturnValue({
      data: {
        parent_project_ref: null,
        ref: 'paused-project',
        status: 'INACTIVE',
      },
    })

    mockUseProjectPauseStatusQuery.mockReturnValue({
      data: { can_restore: true },
      isError: false,
      isSuccess: true,
    })

    render(<Project />)

    expect(screen.getByText('Resume project')).toBeInTheDocument()
    expect(screen.getByText('Bring your paused project back online.')).toBeInTheDocument()
    expect(screen.getByText('ResumeProjectButton')).toBeInTheDocument()
    expect(screen.queryByText('Pause project')).not.toBeInTheDocument()
    expect(screen.queryByText('PauseProjectButton')).not.toBeInTheDocument()
    expect(screen.queryByText('RestartServerButton')).not.toBeInTheDocument()
  })

  it('links back to the dashboard when the paused project can no longer be restored', () => {
    mockUseSelectedProjectQuery.mockReturnValue({
      data: {
        parent_project_ref: null,
        ref: 'paused-project',
        status: 'INACTIVE',
      },
    })

    mockUseProjectPauseStatusQuery.mockReturnValue({
      data: { can_restore: false },
      isError: false,
      isSuccess: true,
    })

    render(<Project />)

    expect(screen.getAllByText('View project dashboard')).toHaveLength(2)
    expect(
      screen.getByText(
        'This project can no longer be resumed here. Open the dashboard to download backups and view recovery options.'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View project dashboard' })).toHaveAttribute(
      'href',
      '/project/paused-project'
    )
    expect(screen.queryByText('Pause project')).not.toBeInTheDocument()
    expect(screen.queryByText('PauseProjectButton')).not.toBeInTheDocument()
    expect(screen.queryByText('ResumeProjectButton')).not.toBeInTheDocument()
  })
})
