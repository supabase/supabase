import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrganizationDropdown } from './OrganizationDropdown'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { createMockOrganization, render } from '@/tests/helpers'

const {
  mockUseIsFeatureEnabled,
  mockUseOrganizationsQuery,
  mockUseSelectedOrganizationQuery,
  mockUsePlanBadgeUpgradeExperiment,
} = vi.hoisted(() => ({
  mockUseIsFeatureEnabled: vi.fn(),
  mockUseOrganizationsQuery: vi.fn(),
  mockUseSelectedOrganizationQuery: vi.fn(),
  mockUsePlanBadgeUpgradeExperiment: vi.fn(),
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mockUseIsFeatureEnabled,
}))

vi.mock('@/hooks/misc/usePlanBadgeUpgradeExperiment', () => ({
  usePlanBadgeUpgradeExperiment: mockUsePlanBadgeUpgradeExperiment,
}))

vi.mock('@/data/organizations/organizations-query', () => ({
  useOrganizationsQuery: mockUseOrganizationsQuery,
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: mockUseSelectedOrganizationQuery,
}))

vi.mock('@/components/ui/PartnerIcon', () => ({
  default: ({ organization }: { organization: { managed_by: string } }) =>
    organization.managed_by === MANAGED_BY.SUPABASE ? null : <div data-testid="partner-icon" />,
}))

describe('OrganizationDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsFeatureEnabled.mockReturnValue(false)
    // Default to the control arm so the plan badge stays inline (non-clickable).
    mockUsePlanBadgeUpgradeExperiment.mockReturnValue({ isFreePlan: true, variant: 'control' })
    mockUseOrganizationsQuery.mockReturnValue({
      data: [
        createMockOrganization({ slug: 'org-one', name: 'Org One' }),
        createMockOrganization({ slug: 'org-two', name: 'Org Two' }),
      ],
      isPending: false,
      isError: false,
    })
  })

  it('renders partner icon in selected organization area for managed organizations', () => {
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganization({
        slug: 'org-one',
        name: 'Org One',
        managed_by: MANAGED_BY.AWS_MARKETPLACE,
      }),
    })

    render(<OrganizationDropdown />)

    const selectedLink = screen.getByRole('link', { name: /org one/i })
    expect(within(selectedLink).getByTestId('partner-icon')).toBeInTheDocument()
  })

  it('does not render partner icon in selected organization area for Supabase-managed orgs', () => {
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganization({
        slug: 'org-one',
        name: 'Org One',
        managed_by: MANAGED_BY.SUPABASE,
      }),
    })

    render(<OrganizationDropdown />)

    const selectedLink = screen.getByRole('link', { name: /org one/i })
    expect(within(selectedLink).queryByTestId('partner-icon')).toBeNull()
  })

  it('renders the plan badge as an upgrade link in the experiment test arm', () => {
    mockUsePlanBadgeUpgradeExperiment.mockReturnValue({ isFreePlan: true, variant: 'test' })
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganization({ slug: 'org-one', name: 'Org One' }),
    })

    render(<OrganizationDropdown />)

    const badgeLink = screen.getByRole('link', { name: /free/i })
    expect(badgeLink).toHaveAttribute(
      'href',
      '/org/org-one/billing?panel=subscriptionPlan&source=org_plan_badge'
    )
    // The org name link should not point to the upgrade funnel.
    expect(screen.getByRole('link', { name: /org one/i })).toHaveAttribute('href', '/org/org-one')
  })

  it('keeps the plan badge non-clickable in the control arm', () => {
    mockUsePlanBadgeUpgradeExperiment.mockReturnValue({ isFreePlan: true, variant: 'control' })
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganization({ slug: 'org-one', name: 'Org One' }),
    })

    render(<OrganizationDropdown />)

    // No standalone upgrade link — the badge stays inline within the org name link, which
    // still points at the org overview rather than the upgrade funnel.
    const upgradeLink = screen
      .getAllByRole('link')
      .find((link) => link.getAttribute('href')?.includes('panel=subscriptionPlan'))
    expect(upgradeLink).toBeUndefined()
    expect(screen.getByRole('link', { name: /org one/i })).toHaveAttribute('href', '/org/org-one')
  })
})
