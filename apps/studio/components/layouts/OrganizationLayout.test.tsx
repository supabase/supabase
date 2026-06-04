import { fireEvent, screen } from '@testing-library/react'
import { LOCAL_STORAGE_KEYS } from 'common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import OrganizationLayout from './OrganizationLayout'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { createMockOrganization, render } from '@/tests/helpers'

const {
  mockUseAwsRedirectQuery,
  mockUseCustomContent,
  mockUseLocalStorageQuery,
  mockSetIsBannerDismissed,
  mockUseRegisterOrgMenu,
  mockUseSelectedOrganizationQuery,
  mockUseVercelRedirectQuery,
} = vi.hoisted(() => ({
  mockUseAwsRedirectQuery: vi.fn(),
  mockUseCustomContent: vi.fn(),
  mockUseLocalStorageQuery: vi.fn(),
  mockSetIsBannerDismissed: vi.fn(),
  mockUseRegisterOrgMenu: vi.fn(),
  mockUseSelectedOrganizationQuery: vi.fn(),
  mockUseVercelRedirectQuery: vi.fn(),
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: mockUseSelectedOrganizationQuery,
}))

vi.mock('@/data/integrations/vercel-redirect-query', () => ({
  useVercelRedirectQuery: mockUseVercelRedirectQuery,
}))

vi.mock('@/data/integrations/aws-redirect-query', () => ({
  useAwsRedirectQuery: mockUseAwsRedirectQuery,
}))

vi.mock('@/hooks/misc/useLocalStorage', () => ({
  useLocalStorageQuery: mockUseLocalStorageQuery,
}))

vi.mock('@/hooks/custom-content/useCustomContent', () => ({
  useCustomContent: mockUseCustomContent,
}))

vi.mock('@/hooks/misc/withAuth', () => ({
  withAuth: (Component: any) => Component,
}))

vi.mock('./OrganizationLayout/useRegisterOrgMenu', () => ({
  useRegisterOrgMenu: mockUseRegisterOrgMenu,
}))

vi.mock('@/components/ui/PartnerIcon', () => ({
  default: () => <div data-testid="partner-icon" />,
}))

const renderLayout = () =>
  render(
    <OrganizationLayout title="General">
      <div>Organization content</div>
    </OrganizationLayout>
  )

describe('OrganizationLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseLocalStorageQuery.mockReturnValue([
      false,
      mockSetIsBannerDismissed,
      { isSuccess: true, isLoading: false, isError: false, error: null },
    ])
    mockUseCustomContent.mockReturnValue({ appTitle: 'Supabase' })
    mockUseVercelRedirectQuery.mockReturnValue({ data: undefined, isSuccess: false })
    mockUseAwsRedirectQuery.mockReturnValue({ data: undefined, isSuccess: false })
  })

  it('renders the exact Vercel banner copy and manage URL', () => {
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganization({
        managed_by: MANAGED_BY.VERCEL_MARKETPLACE,
        partner_id: 'vercel-installation-id',
      }),
    })
    mockUseVercelRedirectQuery.mockReturnValue({
      data: { url: 'https://vercel.com/manage-org' },
      isSuccess: true,
    })

    renderLayout()

    expect(screen.getByText('This organization is managed via Vercel Marketplace')).toBeTruthy()
    expect(
      screen.getByText('Billing and some organization access settings are managed in Vercel.')
    ).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Manage' }).getAttribute('href')).toBe(
      'https://vercel.com/manage-org'
    )
    expect(mockUseVercelRedirectQuery).toHaveBeenCalledWith(
      { installationId: 'vercel-installation-id' },
      expect.objectContaining({ enabled: true })
    )
    expect(mockUseLocalStorageQuery).toHaveBeenCalledWith(
      LOCAL_STORAGE_KEYS.ORGANIZATION_MARKETPLACE_BANNER_DISMISSED(
        'abcdefghijklmnopqrst',
        MANAGED_BY.VERCEL_MARKETPLACE
      ),
      false
    )
    expect(mockUseAwsRedirectQuery).toHaveBeenCalledWith(
      { organizationSlug: 'abcdefghijklmnopqrst' },
      expect.objectContaining({ enabled: false })
    )
  })

  it('renders the exact AWS banner copy and manage URL', () => {
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganization({
        managed_by: MANAGED_BY.AWS_MARKETPLACE,
        slug: 'aws-org',
      }),
    })
    mockUseAwsRedirectQuery.mockReturnValue({
      data: { url: 'https://console.aws.amazon.com/billing/home' },
      isSuccess: true,
    })

    renderLayout()

    expect(screen.getByText('This organization is billed via AWS Marketplace')).toBeTruthy()
    expect(
      screen.getByText('Changes to billing and payment details must be made in AWS.')
    ).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Manage' }).getAttribute('href')).toBe(
      'https://console.aws.amazon.com/billing/home'
    )
    expect(mockUseAwsRedirectQuery).toHaveBeenCalledWith(
      { organizationSlug: 'aws-org' },
      expect.objectContaining({ enabled: true })
    )
    expect(mockUseLocalStorageQuery).toHaveBeenCalledWith(
      LOCAL_STORAGE_KEYS.ORGANIZATION_MARKETPLACE_BANNER_DISMISSED(
        'aws-org',
        MANAGED_BY.AWS_MARKETPLACE
      ),
      false
    )
    expect(mockUseVercelRedirectQuery).toHaveBeenCalledWith(
      { installationId: undefined },
      expect.objectContaining({ enabled: false })
    )
  })

  it('does not render Manage for Vercel when redirect URL is unavailable', () => {
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganization({
        managed_by: MANAGED_BY.VERCEL_MARKETPLACE,
        partner_id: 'vercel-installation-id',
      }),
    })
    mockUseVercelRedirectQuery.mockReturnValue({
      data: undefined,
      isSuccess: false,
    })

    renderLayout()

    expect(screen.getByText('This organization is managed via Vercel Marketplace')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Manage' })).toBeNull()
  })

  it('does not render Manage for AWS when redirect URL is unavailable', () => {
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganization({
        managed_by: MANAGED_BY.AWS_MARKETPLACE,
        slug: 'aws-org',
      }),
    })
    mockUseAwsRedirectQuery.mockReturnValue({
      data: undefined,
      isSuccess: false,
    })

    renderLayout()

    expect(screen.getByText('This organization is billed via AWS Marketplace')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Manage' })).toBeNull()
  })

  it('does not render a banner for Supabase-managed organizations', () => {
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganization({
        managed_by: MANAGED_BY.SUPABASE,
      }),
    })

    renderLayout()

    expect(screen.queryByRole('link', { name: 'Manage' })).toBeNull()
    expect(screen.queryByText('This organization is managed via Vercel Marketplace')).toBeNull()
    expect(screen.queryByText('This organization is billed via AWS Marketplace')).toBeNull()
  })

  it('renders Stripe connected copy with no Manage button', () => {
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganization({
        managed_by: MANAGED_BY.STRIPE_PROJECTS,
      }),
    })

    renderLayout()

    expect(screen.getByText('This organization is connected to Stripe')).toBeTruthy()
    expect(
      screen.getByText('Changes here will be reflected in your connected Stripe account.')
    ).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Manage' })).toBeNull()
    expect(mockUseVercelRedirectQuery).toHaveBeenCalledWith(
      { installationId: undefined },
      expect.objectContaining({ enabled: false })
    )
    expect(mockUseLocalStorageQuery).toHaveBeenCalledWith(
      LOCAL_STORAGE_KEYS.ORGANIZATION_MARKETPLACE_BANNER_DISMISSED(
        'abcdefghijklmnopqrst',
        MANAGED_BY.STRIPE_PROJECTS
      ),
      false
    )
    expect(mockUseAwsRedirectQuery).toHaveBeenCalledWith(
      { organizationSlug: 'abcdefghijklmnopqrst' },
      expect.objectContaining({ enabled: false })
    )
  })

  it('hides banner when dismissal state is persisted', () => {
    mockUseLocalStorageQuery.mockReturnValue([
      true,
      mockSetIsBannerDismissed,
      { isSuccess: true, isLoading: false, isError: false, error: null },
    ])
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganization({
        managed_by: MANAGED_BY.VERCEL_MARKETPLACE,
        partner_id: 'vercel-installation-id',
      }),
    })

    renderLayout()

    expect(screen.queryByRole('link', { name: 'Manage' })).toBeNull()
    expect(screen.queryByText('This organization is managed via Vercel Marketplace')).toBeNull()
  })

  it('dismisses the banner and persists the state', () => {
    mockUseSelectedOrganizationQuery.mockReturnValue({
      data: createMockOrganization({
        managed_by: MANAGED_BY.AWS_MARKETPLACE,
      }),
    })
    mockUseAwsRedirectQuery.mockReturnValue({
      data: { url: 'https://console.aws.amazon.com/billing/home' },
      isSuccess: true,
    })

    renderLayout()

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss banner' }))
    expect(mockSetIsBannerDismissed).toHaveBeenCalledWith(true)
  })
})
