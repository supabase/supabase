import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrganizationDropdown } from './OrganizationDropdown'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { createMockOrganization, render } from '@/tests/helpers'

const {
  mockUseIsFeatureEnabled,
  mockUseOrganizationsQuery,
  mockUseSelectedOrganizationQuery,
  mockUsePHFlag,
} = vi.hoisted(() => ({
  mockUseIsFeatureEnabled: vi.fn(),
  mockUseOrganizationsQuery: vi.fn(),
  mockUseSelectedOrganizationQuery: vi.fn(),
  mockUsePHFlag: vi.fn(),
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mockUseIsFeatureEnabled,
}))

vi.mock('@/hooks/ui/useFlag', () => ({
  usePHFlag: mockUsePHFlag,
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
    mockUsePHFlag.mockReturnValue('control')
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
    mockUsePHFlag.mockReturnValue('test')
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganization({ slug: 'org-one', name: 'Org One' }),
    })

    render(<OrganizationDropdown />)

    expect(screen.getByRole('link', { name: /upgrade from the free plan/i })).toHaveAttribute(
      'href',
      '/org/org-one/billing?panel=subscriptionPlan&source=org_plan_badge'
    )
    expect(screen.getByRole('link', { name: /org one/i })).toHaveAttribute('href', '/org/org-one')
  })

  it('keeps the plan badge inline for a partner-managed org in the test arm', () => {
    mockUsePHFlag.mockReturnValue('test')
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganization({
        slug: 'org-one',
        name: 'Org One',
        managed_by: MANAGED_BY.VERCEL_MARKETPLACE,
      }),
    })

    render(<OrganizationDropdown />)

    // Partner-managed orgs can't change plans here, so they never get the upgrade link.
    const upgradeLink = screen
      .getAllByRole('link')
      .find((link) => link.getAttribute('href')?.includes('panel=subscriptionPlan'))
    expect(upgradeLink).toBeUndefined()
  })

  it('keeps the plan badge non-clickable in the control arm', () => {
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganization({ slug: 'org-one', name: 'Org One' }),
    })

    render(<OrganizationDropdown />)

    const upgradeLink = screen
      .getAllByRole('link')
      .find((link) => link.getAttribute('href')?.includes('panel=subscriptionPlan'))
    expect(upgradeLink).toBeUndefined()
    expect(screen.getByRole('link', { name: /org one/i })).toHaveAttribute('href', '/org/org-one')
  })
})
