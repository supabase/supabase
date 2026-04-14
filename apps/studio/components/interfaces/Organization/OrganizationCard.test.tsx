import { screen } from '@testing-library/react'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { createMockOrganization, render } from 'tests/helpers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockUseOrgProjectsInfiniteQuery } = vi.hoisted(() => ({
  mockUseOrgProjectsInfiniteQuery: vi.fn(),
}))

vi.mock('common', async (importOriginal: any) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useIsMFAEnabled: () => true,
  }
})

vi.mock('data/projects/org-projects-infinite-query', () => ({
  useOrgProjectsInfiniteQuery: mockUseOrgProjectsInfiniteQuery,
}))

vi.mock('components/ui/PartnerIcon', () => ({
  default: ({ organization }: { organization: { managed_by: string } }) =>
    organization.managed_by === MANAGED_BY.SUPABASE ? null : (
      <div data-testid="organization-card-partner-icon" />
    ),
}))

import { OrganizationCard } from './OrganizationCard'

describe('OrganizationCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseOrgProjectsInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            pagination: { count: 1 },
          },
        ],
      },
    })
  })

  it('renders partner icon in metadata row for managed organizations', () => {
    render(
      <OrganizationCard
        isLink={false}
        organization={createMockOrganization({ managed_by: MANAGED_BY.VERCEL_MARKETPLACE })}
      />
    )

    expect(screen.getByTestId('organization-card-partner-icon')).toBeInTheDocument()
  })

  it('does not render partner icon in metadata row for Supabase-managed organizations', () => {
    render(
      <OrganizationCard
        isLink={false}
        organization={createMockOrganization({ managed_by: MANAGED_BY.SUPABASE })}
      />
    )

    expect(screen.queryByTestId('organization-card-partner-icon')).toBeNull()
  })
})
