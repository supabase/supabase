import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrganizationDropdown } from './OrganizationDropdown'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { createMockOrganization, render } from '@/tests/helpers'
import type { Organization } from '@/types'

const {
  mockUseFlag,
  mockUseIsFeatureEnabled,
  mockUseOrganizationsQuery,
  mockUseSelectedOrganizationQuery,
} = vi.hoisted(() => ({
  mockUseFlag: vi.fn(),
  mockUseIsFeatureEnabled: vi.fn(),
  mockUseOrganizationsQuery: vi.fn(),
  mockUseSelectedOrganizationQuery: vi.fn(),
}))

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useFlag: mockUseFlag,
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mockUseIsFeatureEnabled,
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

const queryUpgradeLink = () => screen.queryByRole('link', { name: /upgrade from the/i })

const expectInlinePlanBadge = (planName: string) => {
  const organizationLink = screen.getByRole('link', { name: /org one/i })
  expect(organizationLink).toHaveAttribute('href', '/org/org-one')
  expect(within(organizationLink).getByText(planName)).toBeInTheDocument()
  expect(queryUpgradeLink()).toBeNull()
}

const organizationsWithoutUpgradeLink: Array<{
  description: string
  organization: Partial<Organization>
  planName: string
}> = [
  {
    description: 'a partner-managed org',
    organization: { managed_by: MANAGED_BY.VERCEL_MARKETPLACE },
    planName: 'Free',
  },
  {
    description: 'an org with a billing partner',
    organization: { billing_partner: 'aws_marketplace' },
    planName: 'Free',
  },
  {
    description: 'an org on a paid plan',
    organization: { plan: { id: 'pro', name: 'Pro' } },
    planName: 'Pro',
  },
]

describe('OrganizationDropdown', () => {
  beforeEach(() => {
    mockUseFlag.mockReturnValue(false)
    mockUseIsFeatureEnabled.mockImplementation((feature: string) => feature === 'billing:all')
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

  it('renders the plan badge as an upgrade link for a Free Supabase-managed org', () => {
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

  it.each(organizationsWithoutUpgradeLink)(
    'keeps the plan badge inline for $description',
    ({ organization, planName }) => {
      mockUseSelectedOrganizationQuery.mockReturnValue({
        data: createMockOrganization({ slug: 'org-one', name: 'Org One', ...organization }),
      })

      render(<OrganizationDropdown />)

      expectInlinePlanBadge(planName)
    }
  )

  it('keeps the plan badge inline when billing is disabled', () => {
    mockUseIsFeatureEnabled.mockReturnValue(false)
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganization({ slug: 'org-one', name: 'Org One' }),
    })

    render(<OrganizationDropdown />)

    expectInlinePlanBadge('Free')
  })

  it('keeps the plan badge inline while plan changes are paused', () => {
    mockUseFlag.mockImplementation((flag: string) => flag === 'disableProjectCreationAndUpdate')
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganization({ slug: 'org-one', name: 'Org One' }),
    })

    render(<OrganizationDropdown />)

    expectInlinePlanBadge('Free')
  })

  it('renders organization command items as links', () => {
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganization({ slug: 'org-one', name: 'Org One' }),
    })

    render(<OrganizationDropdown embedded />)

    const organizationLink = screen.getByRole('link', { name: /org two/i })
    expect(within(organizationLink).getByRole('option')).toBeInTheDocument()
    expect(organizationLink).toHaveAttribute('href', '/org/org-two')
  })
})
