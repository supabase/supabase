import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectDropdown } from './ProjectDropdown'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { createMockOrganization, render } from '@/tests/helpers'

const { mockSelectedOrganization, mockSelectedProject, mockSelectorProject } = vi.hoisted(() => ({
  mockSelectedOrganization: vi.fn(),
  mockSelectedProject: vi.fn(),
  mockSelectorProject: vi.fn(),
}))

const mockPush = vi.hoisted(() => vi.fn())

vi.mock('common', async (importOriginal) => {
  const original = (await importOriginal()) as typeof import('common')
  return {
    ...original,
    useParams: () => ({ ref: 'proj_1' }),
  }
})

vi.mock('next/router', () => ({
  useRouter: () => ({
    route: '/project/[ref]/settings',
    query: { ref: 'proj_1' },
    push: mockPush,
  }),
}))

vi.mock('@/lib/constants', async (importOriginal) => {
  const original = (await importOriginal()) as typeof import('@/lib/constants')
  return { ...original, IS_PLATFORM: true }
})

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: () => ({
    data: mockSelectedProject(),
    isPending: false,
  }),
}))

vi.mock('@/data/projects/project-detail-query', () => ({
  useProjectDetailQuery: () => ({ data: undefined, isPending: false }),
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: mockSelectedOrganization() }),
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => false,
}))

vi.mock('@/components/ui/OrganizationProjectSelector', () => ({
  OrganizationProjectSelector: ({ renderRow, renderTrigger }: any) => (
    <div>
      <div data-testid="project-selector-trigger">{renderTrigger?.({})}</div>
      <div data-testid="project-selector-row">{renderRow?.(mockSelectorProject())}</div>
    </div>
  ),
}))

vi.mock('@/components/ui/PartnerIcon', () => ({
  default: ({ organization }: { organization: { managed_by: string } }) =>
    organization.managed_by === MANAGED_BY.SUPABASE ? null : (
      <div data-testid="partner-icon" data-managed-by={organization.managed_by} />
    ),
}))

describe('ProjectDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelectedOrganization.mockReturnValue(
      createMockOrganization({
        slug: 'supabase-org',
        managed_by: MANAGED_BY.SUPABASE,
      })
    )
    mockSelectedProject.mockReturnValue({
      ref: 'proj_1',
      name: 'Hammer',
      parentRef: 'proj_1',
      parent_project_ref: undefined,
      integration_source: 'stripe_projects',
    })
    mockSelectorProject.mockReturnValue({
      ref: 'proj_1',
      name: 'Hammer',
      status: 'ACTIVE_HEALTHY',
      integration_source: 'stripe_projects',
    })
  })

  it('uses project detail integration_source for the selected pill and project row data for selector rows', () => {
    mockSelectedOrganization.mockReturnValue(
      createMockOrganization({
        slug: 'stripe-org',
        billing_partner: null,
        integration_source: 'stripe_projects',
        managed_by: MANAGED_BY.STRIPE_PROJECTS,
      })
    )

    render(<ProjectDropdown />)

    expect(screen.getAllByTestId('partner-icon')).toHaveLength(2)
  })

  it('does not fall back to org-level integration state when matching project data is unavailable', () => {
    mockSelectedOrganization.mockReturnValue(
      createMockOrganization({
        slug: 'stripe-org',
        billing_partner: null,
        integration_source: 'stripe_projects',
        managed_by: MANAGED_BY.STRIPE_PROJECTS,
      })
    )
    mockSelectedProject.mockReturnValue({
      ref: 'proj_2',
      name: 'Mallet',
      parentRef: 'proj_2',
      parent_project_ref: undefined,
      integration_source: null,
    })
    mockSelectorProject.mockReturnValue({
      ref: 'proj_2',
      name: 'Mallet',
      status: 'ACTIVE_HEALTHY',
      integration_source: null,
    })

    render(<ProjectDropdown />)

    expect(screen.queryAllByTestId('partner-icon')).toHaveLength(0)
  })

  it('falls back to the organization-level state for partner-billed orgs', () => {
    mockSelectedOrganization.mockReturnValue(
      createMockOrganization({
        slug: 'partner-org',
        billing_partner: 'vercel_marketplace',
        managed_by: MANAGED_BY.VERCEL_MARKETPLACE,
      })
    )
    mockSelectedProject.mockReturnValue({
      ref: 'proj_2',
      name: 'Mallet',
      parentRef: 'proj_2',
      parent_project_ref: undefined,
      integration_source: null,
    })
    mockSelectorProject.mockReturnValue({
      ref: 'proj_2',
      name: 'Mallet',
      status: 'ACTIVE_HEALTHY',
      integration_source: null,
    })

    render(<ProjectDropdown />)

    expect(screen.getAllByTestId('partner-icon')).toHaveLength(1)
    expect(screen.getByTestId('partner-icon')).toHaveAttribute(
      'data-managed-by',
      MANAGED_BY.VERCEL_MARKETPLACE
    )
  })
})
