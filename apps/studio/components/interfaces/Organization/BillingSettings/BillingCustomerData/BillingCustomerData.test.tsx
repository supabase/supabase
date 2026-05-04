import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BillingCustomerData } from './BillingCustomerData'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { createMockOrganization, render } from '@/tests/helpers'

const mockSelectedOrganization = vi.hoisted(() => vi.fn())

vi.mock('common', async (importOriginal) => {
  const original = (await importOriginal()) as typeof import('common')
  return {
    ...original,
    useParams: () => ({ slug: 'stripe-org' }),
  }
})

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'dark' }),
}))

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve(null)),
}))

vi.mock('ui', async (importOriginal) => {
  const original = (await importOriginal()) as typeof import('ui')
  return {
    ...original,
    Form: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  }
})

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: mockSelectedOrganization() }),
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: () => ({ can: true, isSuccess: true }),
}))

vi.mock('@/data/organizations/organization-customer-profile-query', () => ({
  useOrganizationCustomerProfileQuery: () => ({
    data: {
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US',
      },
      billing_name: 'Toolshed',
    },
    error: null,
    isPending: false,
    isSuccess: true,
  }),
}))

vi.mock('@/data/organizations/organization-tax-id-query', () => ({
  useOrganizationTaxIdQuery: () => ({
    data: null,
    error: null,
    isPending: false,
    isSuccess: true,
  }),
}))

vi.mock('@/data/organizations/organization-customer-profile-update-mutation', () => ({
  useOrganizationCustomerProfileUpdateMutation: () => ({
    mutateAsync: vi.fn(),
  }),
}))

vi.mock('./useBillingCustomerDataForm', () => ({
  useBillingCustomerDataForm: () => ({
    form: {},
    handleSubmit: vi.fn(),
    handleReset: vi.fn(),
    isDirty: false,
    resetKey: 0,
    onAddressChange: vi.fn(),
    applyAddressElementValue: vi.fn(),
    markCurrentValuesAsSaved: vi.fn(),
    addressCountry: 'US',
    addressOptions: {},
  }),
}))

vi.mock('./BillingCustomerDataForm', () => ({
  BillingCustomerDataForm: () => <div data-testid="billing-customer-data-form" />,
}))

vi.mock('@/components/ui/PartnerManagedResource', () => ({
  default: () => <div data-testid="partner-managed-resource" />,
}))

describe('BillingCustomerData', () => {
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
  })

  it('keeps Stripe-connected orgs editable in Studio', () => {
    render(<BillingCustomerData />)

    expect(screen.queryByTestId('partner-managed-resource')).not.toBeInTheDocument()
    expect(screen.getByTestId('billing-customer-data-form')).toBeInTheDocument()
  })

  it('still blocks billing-partner orgs behind the partner-managed resource', () => {
    mockSelectedOrganization.mockReturnValue(
      createMockOrganization({
        slug: 'vercel-org',
        billing_partner: 'vercel_marketplace',
        managed_by: MANAGED_BY.VERCEL_MARKETPLACE,
      })
    )

    render(<BillingCustomerData />)

    expect(screen.getByTestId('partner-managed-resource')).toBeInTheDocument()
  })
})
