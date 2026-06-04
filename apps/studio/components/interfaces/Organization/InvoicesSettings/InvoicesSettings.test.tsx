import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvoicesSettings } from './InvoicesSettings'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { createMockOrganization, render } from '@/tests/helpers'

const { mockSelectedOrganization, mockInvoicesQuery, mockInvoicesCountQuery } = vi.hoisted(() => ({
  mockSelectedOrganization: vi.fn(),
  mockInvoicesQuery: vi.fn(),
  mockInvoicesCountQuery: vi.fn(),
}))

vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: mockSelectedOrganization() }),
}))

vi.mock('@/data/invoices/invoices-query', () => ({
  useInvoicesQuery: () => mockInvoicesQuery(),
}))

vi.mock('@/data/invoices/invoices-count-query', () => ({
  useInvoicesCountQuery: () => mockInvoicesCountQuery(),
}))

vi.mock('@/data/invoices/invoice-query', () => ({
  getInvoice: vi.fn(),
}))

vi.mock('@/data/invoices/invoice-receipt-query', () => ({
  getInvoiceReceipt: vi.fn(),
}))

vi.mock('@/components/ui/PartnerManagedResource', () => ({
  default: () => <div data-testid="partner-managed-resource" />,
}))

describe('InvoicesSettings', () => {
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
    mockInvoicesCountQuery.mockReturnValue({ data: 0, isError: false })
    mockInvoicesQuery.mockReturnValue({
      data: [],
      error: null,
      isPending: false,
      isError: false,
    })
  })

  it('shows invoices in Studio for Stripe-connected orgs', () => {
    render(<InvoicesSettings />)

    expect(screen.queryByTestId('partner-managed-resource')).not.toBeInTheDocument()
    expect(screen.getByText('No invoices for this organization yet')).toBeInTheDocument()
  })

  it('still routes billing-partner orgs to the partner-managed resource', () => {
    mockSelectedOrganization.mockReturnValue(
      createMockOrganization({
        slug: 'aws-org',
        billing_partner: 'aws_marketplace',
        managed_by: MANAGED_BY.AWS_MARKETPLACE,
      })
    )

    render(<InvoicesSettings />)

    expect(screen.getByTestId('partner-managed-resource')).toBeInTheDocument()
  })
})
