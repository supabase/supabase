import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PaymentMethods from './PaymentMethods'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { createMockOrganization, render } from '@/tests/helpers'

const { mockSelectedOrganization, mockPaymentMethodsQuery, mockSubscription } = vi.hoisted(() => ({
  mockSelectedOrganization: vi.fn(),
  mockPaymentMethodsQuery: vi.fn(),
  mockSubscription: vi.fn(),
}))

vi.mock('common', async (importOriginal) => {
  const original = (await importOriginal()) as typeof import('common')
  return {
    ...original,
    useParams: () => ({ slug: 'stripe-org' }),
  }
})

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: mockSelectedOrganization() }),
}))

vi.mock('@/data/subscriptions/org-subscription-query', () => ({
  useOrgSubscriptionQuery: () => ({ data: mockSubscription() }),
}))

vi.mock('@/data/organizations/organization-payment-methods-query', () => ({
  useOrganizationPaymentMethodsQuery: () => mockPaymentMethodsQuery(),
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true, isSuccess: true }),
}))

vi.mock('@/components/ui/PartnerManagedResource', () => ({
  default: () => <div data-testid="partner-managed-resource" />,
}))

vi.mock('@/components/interfaces/Billing/Payment/AddNewPaymentMethodModal', () => ({
  default: () => null,
}))

vi.mock('./ChangePaymentMethodModal', () => ({
  default: () => null,
}))

vi.mock('./DeletePaymentMethodModal', () => ({
  default: () => null,
}))

describe('PaymentMethods', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelectedOrganization.mockReturnValue(
      createMockOrganization({
        slug: 'stripe-org',
        billing_partner: null,
        integration_source: 'stripe_projects',
        managed_by: MANAGED_BY.STRIPE_PROJECTS,
      })
    )
    mockSubscription.mockReturnValue({
      payment_method_type: 'card',
      plan: { id: 'pro', name: 'Pro' },
    })
    mockPaymentMethodsQuery.mockReturnValue({
      data: { data: [] },
      error: null,
      isPending: false,
      isError: false,
      isSuccess: true,
    })
  })

  it('does not treat Stripe-connected orgs as partner-billed', () => {
    render(<PaymentMethods />)

    expect(screen.queryByTestId('partner-managed-resource')).not.toBeInTheDocument()
    expect(screen.getByText('No payment methods')).toBeInTheDocument()
  })

  it('uses Stripe Projects guidance instead of support for invoice-based Stripe orgs', () => {
    mockSubscription.mockReturnValue({
      payment_method_type: 'invoice',
      plan: { id: 'pro', name: 'Pro' },
    })

    render(<PaymentMethods />)

    expect(screen.getByText('Payment is currently by invoice')).toBeInTheDocument()
    expect(screen.getByText(/Manage payment methods through Stripe Projects/)).toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: 'View Stripe Projects docs',
      })
    ).toBeInTheDocument()
    expect(screen.queryByText('Contact support')).not.toBeInTheDocument()
  })

  it('still shows the partner-managed fallback for billing partners', () => {
    mockSelectedOrganization.mockReturnValue(
      createMockOrganization({
        slug: 'aws-org',
        billing_partner: 'aws_marketplace',
        managed_by: MANAGED_BY.AWS_MARKETPLACE,
      })
    )

    render(<PaymentMethods />)

    expect(screen.getByTestId('partner-managed-resource')).toBeInTheDocument()
  })

  it('keeps the standard card row copy for non-Stripe payment methods', () => {
    mockSelectedOrganization.mockReturnValue(
      createMockOrganization({
        slug: 'self-serve-org',
        billing_partner: null,
        integration_source: null,
        managed_by: MANAGED_BY.SUPABASE,
      })
    )
    mockPaymentMethodsQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 'pm_123',
            type: 'card',
            is_default: true,
            has_address: true,
            created: 1_776_700_000,
            card: {
              brand: 'visa',
              exp_month: 12,
              exp_year: 2028,
              last4: '4242',
            },
            shared_payment_token: null,
          },
        ],
      },
      error: null,
      isPending: false,
      isError: false,
      isSuccess: true,
    })

    render(<PaymentMethods />)

    expect(screen.getByText('Expires: 12/2028')).toBeInTheDocument()
    expect(screen.queryByText(/Managed via Stripe Projects/i)).not.toBeInTheDocument()
  })

  it('shows Stripe Projects payment method details separately from the underlying card', () => {
    mockPaymentMethodsQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 'spt._1T0w6VJDPojXS6LNK3clVOLZ',
            type: 'shared_payment_token',
            is_default: true,
            has_address: true,
            created: 1_776_700_000,
            card: {
              brand: 'visa',
              exp_month: 12,
              exp_year: 2028,
              last4: '4242',
            },
            shared_payment_token: {
              last4: 'VOLZ',
              expires_at: 1_860_883_200,
              is_expired: false,
            },
          },
        ],
      },
      error: null,
      isPending: false,
      isError: false,
      isSuccess: true,
    })

    render(<PaymentMethods />)

    expect(screen.getByText('**** **** **** 4242')).toBeInTheDocument()
    expect(screen.getByText('Expires: 12/2028')).toBeInTheDocument()
    expect(screen.getByText(/Managed via Stripe Projects/i)).toBeInTheDocument()
    expect(screen.getByText('VOLZ')).toBeInTheDocument()
    expect(screen.getByText(/Expires 12\/2028/i, { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})
