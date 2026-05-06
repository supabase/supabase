import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OrganizationDropdown } from './OrganizationDropdown'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { createMockOrganization, render } from '@/tests/helpers'

const { mockUseIsFeatureEnabled, mockUseOrganizationsQuery, mockUseSelectedOrganizationQuery } =
  vi.hoisted(() => ({
    mockUseIsFeatureEnabled: vi.fn(),
    mockUseOrganizationsQuery: vi.fn(),
    mockUseSelectedOrganizationQuery: vi.fn(),
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

describe('OrganizationDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsFeatureEnabled.mockReturnValue(false)
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
})
