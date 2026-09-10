import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockIntersectionObserver } from 'jsdom-testing-mocks'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvoicesSettings } from './InvoicesSettings'
import { getInvoice } from '@/data/invoices/invoice-query'
import type { InvoicesData } from '@/data/invoices/invoices-query'
import { MANAGED_BY } from '@/lib/constants/infrastructure'
import { createMockOrganization, render } from '@/tests/helpers'

type Invoice = NonNullable<InvoicesData>[number]

mockIntersectionObserver()

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

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const createMockInvoice = (details: Partial<Invoice> = {}): Invoice => ({
  id: 'in_123',
  number: 'ABCD-0001',
  amount_due: 0,
  invoice_pdf: 'https://example.com/invoice.pdf',
  payment_attempted: false,
  payment_is_processing: false,
  period_end: 1_700_000_000,
  status: 'draft',
  subscription: null,
  subtotal: 0,
  ...details,
})

const createMockInvoiceWithoutPdf = (): Invoice => {
  const invoice = createMockInvoice()
  // The API can return null for invoice_pdf. Not reflected in the generated schema yet, but
  // will be soon — drop the cast once the type is nullable.
  ;(invoice as any).invoice_pdf = null
  return invoice
}

describe('InvoicesSettings', () => {
  beforeEach(() => {
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

  it('disables the download button for invoices without a PDF', () => {
    mockInvoicesCountQuery.mockReturnValue({ data: 1, isError: false })
    mockInvoicesQuery.mockReturnValue({
      data: [createMockInvoiceWithoutPdf()],
      error: null,
      isPending: false,
      isError: false,
    })

    render(<InvoicesSettings />)

    expect(screen.getByRole('button', { name: 'Download invoice' })).toBeDisabled()
  })

  it('shows an error when the fetched invoice has no PDF', async () => {
    mockInvoicesCountQuery.mockReturnValue({ data: 1, isError: false })
    mockInvoicesQuery.mockReturnValue({
      data: [createMockInvoice()],
      error: null,
      isPending: false,
      isError: false,
    })
    vi.mocked(getInvoice).mockResolvedValue(createMockInvoiceWithoutPdf())

    render(<InvoicesSettings />)
    await userEvent.click(screen.getByRole('button', { name: 'Download invoice' }))

    expect(toast.error).toHaveBeenCalledWith(
      'Invoice PDF is not available yet. Please try again later.'
    )
  })
})
