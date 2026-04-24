import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PartnerManagedResource from './PartnerManagedResource'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { render } from '@/tests/helpers'

const { mockUseAwsRedirectQuery, mockUseVercelRedirectQuery } = vi.hoisted(() => ({
  mockUseAwsRedirectQuery: vi.fn(),
  mockUseVercelRedirectQuery: vi.fn(),
}))

vi.mock('@/data/integrations/vercel-redirect-query', () => ({
  useVercelRedirectQuery: mockUseVercelRedirectQuery,
}))

vi.mock('@/data/integrations/aws-redirect-query', () => ({
  useAwsRedirectQuery: mockUseAwsRedirectQuery,
}))

vi.mock('./PartnerIcon', () => ({
  default: () => <div data-testid="partner-icon" />,
}))

describe('PartnerManagedResource', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseVercelRedirectQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    })
    mockUseAwsRedirectQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    })
  })

  it('renders Stripe connected copy and never shows CTA even when cta prop exists', () => {
    render(
      <PartnerManagedResource
        managedBy={MANAGED_BY.STRIPE_PROJECTS}
        resource="Payment Methods"
        details={
          <>
            Run <code>stripe projects upgrade supabase/free</code>
          </>
        }
        cta={{ installationId: 'vercel-installation-id', organizationSlug: 'aws-org' }}
      />
    )

    expect(screen.getByText('Payment Methods are connected to Stripe')).toBeInTheDocument()
    expect(screen.getByText('stripe projects upgrade supabase/free')).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
    expect(mockUseVercelRedirectQuery).toHaveBeenCalledWith(
      { installationId: 'vercel-installation-id' },
      expect.objectContaining({ enabled: false })
    )
    expect(mockUseAwsRedirectQuery).toHaveBeenCalledWith(
      { organizationSlug: 'aws-org' },
      expect.objectContaining({ enabled: false })
    )
  })

  it('renders AWS CTA only when a redirect URL is available', () => {
    mockUseAwsRedirectQuery.mockReturnValue({
      data: { url: 'https://console.aws.amazon.com/billing/home#/' },
      isLoading: false,
      isError: false,
    })

    render(
      <PartnerManagedResource
        managedBy={MANAGED_BY.AWS_MARKETPLACE}
        resource="Invoices"
        cta={{ organizationSlug: 'aws-org', path: 'bills' }}
      />
    )

    expect(screen.getByText('Invoices are managed by AWS Marketplace')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Invoices on AWS Marketplace' })).toHaveAttribute(
      'href',
      'https://console.aws.amazon.com/billing/home#/bills'
    )
  })

  it('does not render Vercel CTA when redirect URL is unavailable', () => {
    mockUseVercelRedirectQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    })

    render(
      <PartnerManagedResource
        managedBy={MANAGED_BY.VERCEL_MARKETPLACE}
        resource="Organization plans"
        cta={{ installationId: 'vercel-installation-id', path: '/settings' }}
      />
    )

    expect(
      screen.getByText('Organization plans are managed by Vercel Marketplace')
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /view organization plans/i })).toBeNull()
  })
})
