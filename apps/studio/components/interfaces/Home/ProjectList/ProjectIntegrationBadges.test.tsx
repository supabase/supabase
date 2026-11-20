import { screen } from '@testing-library/react'
import type React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ProjectCard } from './ProjectCard'
import { ProjectTableRow } from './ProjectTableRow'
import type { OrgProject } from '@/data/projects/org-projects-infinite-query'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { render } from '@/tests/helpers'

vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('react-inlinesvg', () => ({
  default: () => <div data-testid="inline-svg" />,
}))

vi.mock('./ProjectCardStatus', () => ({
  ProjectCardStatus: () => <div data-testid="project-status" />,
}))

vi.mock('@/components/ui/CardButton', () => ({
  default: ({ title, footer }: { title: React.ReactNode; footer: React.ReactNode }) => (
    <div>
      <div>{title}</div>
      <div>{footer}</div>
    </div>
  ),
}))

vi.mock('@/components/ui/ComputeBadgeWrapper', () => ({
  ComputeBadgeWrapper: () => <div data-testid="compute-badge" />,
}))

vi.mock('@/components/ui/PartnerIcon', () => ({
  default: ({ organization }: { organization: { managed_by: string } }) =>
    organization.managed_by === MANAGED_BY.SUPABASE ? null : (
      <div data-testid="partner-icon" data-managed-by={organization.managed_by} />
    ),
}))

vi.mock('@/data/prefetchers/project.$ref', () => ({
  ProjectIndexPageLink: () => null,
}))

vi.mock('@/hooks/custom-content/useCustomContent', () => ({
  useCustomContent: () => ({ infraAwsNimbusLabel: 'AWS Nimbus' }),
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => ({ projectHomepageShowInstanceSize: false }),
}))

vi.mock('@/lib/navigation', () => ({
  createNavigationHandler: () => vi.fn(),
}))

function createOrgProject(overrides: Partial<OrgProject> = {}): OrgProject {
  return {
    ref: 'proj_1',
    name: 'Hammer',
    status: 'ACTIVE_HEALTHY',
    cloud_provider: 'AWS',
    region: 'us-east-1',
    inserted_at: '2026-04-09T06:36:14.718416',
    is_branch: false,
    integration_source: null,
    databases: [],
    ...overrides,
  } as OrgProject
}

describe('project integration badges', () => {
  it('renders a Stripe badge on project cards from project integration_source', () => {
    render(<ProjectCard project={createOrgProject({ integration_source: 'stripe_projects' })} />)

    expect(screen.getByTestId('partner-icon')).toHaveAttribute(
      'data-managed-by',
      MANAGED_BY.STRIPE_PROJECTS
    )
  })

  it('does not render a Stripe badge on project cards without project integration_source', () => {
    render(<ProjectCard project={createOrgProject()} />)

    expect(screen.queryByTestId('partner-icon')).toBeNull()
  })

  it('renders a Stripe badge on project table rows without requiring Vercel or GitHub integrations', () => {
    render(
      <table>
        <tbody>
          <ProjectTableRow project={createOrgProject({ integration_source: 'stripe_projects' })} />
        </tbody>
      </table>
    )

    expect(screen.getByTestId('partner-icon')).toHaveAttribute(
      'data-managed-by',
      MANAGED_BY.STRIPE_PROJECTS
    )
  })

  it('does not render a Stripe badge on project table rows without project integration_source', () => {
    render(
      <table>
        <tbody>
          <ProjectTableRow project={createOrgProject()} />
        </tbody>
      </table>
    )

    expect(screen.queryByTestId('partner-icon')).toBeNull()
  })
})
