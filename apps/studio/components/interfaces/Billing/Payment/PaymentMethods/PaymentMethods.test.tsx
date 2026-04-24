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
})
