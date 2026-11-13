import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { mockIntersectionObserver } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import type { UpcomingInvoiceData, UpcomingInvoiceUsageLineItem } from './types'
import { UpcomingInvoice } from './UpcomingInvoice'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type UpcomingInvoiceResponse = components['schemas']['UpcomingInvoice_Output']
type OrganizationSlugResponse = components['schemas']['OrganizationSlugResponse_Output']

const ORG_SLUG = 'test-org'

const io = mockIntersectionObserver()

const PERIOD = { start: '2026-11-01T00:00:00Z', end: '2026-12-01T12:00:00Z' }

const createUsageLineItem = (
  details: Partial<Extract<UpcomingInvoiceUsageLineItem, { schema: 'generic' }>> = {}
): UpcomingInvoiceUsageLineItem => ({
  schema: 'generic',
  name: 'Egress',
  description: 'Egress',
  period: PERIOD,
  pre_tax_amount: 0,
  pre_tax_amount_before_discount: 0,
  quantity: null,
  unit_price: null,
  unit_price_desc: null,
  breakdown: [],
  ...details,
})

const createComputeLineItem = (
  details: Partial<Extract<UpcomingInvoiceUsageLineItem, { schema: 'compute' }>> = {}
): UpcomingInvoiceUsageLineItem => ({
  schema: 'compute',
  type: 'compute',
  name: 'Compute Hours',
  period: PERIOD,
  usage_unit: 'hour',
  pre_tax_amount: 10,
  pre_tax_amount_before_discount: 10,
  compute_credits_used: null,
  breakdown: [],
  ...details,
})

const createUpcomingInvoice = (
  details: Partial<UpcomingInvoiceData> = {}
): UpcomingInvoiceData => ({
  appliedCustomerBalance: 0,
  subscription_id: 'sub_123',
  billing_cycle_start: PERIOD.start,
  billing_cycle_end: PERIOD.end,
  currency: 'usd',
  fixed_fees_billing_mode: 'in_advance',
  currentCosts: {
    actualInElapsedCycle: 25,
    fixedFees: {
      lineItems: [
        {
          category: 'fixed_fee',
          name: 'Pro Plan',
          description: 'Pro Plan',
          period: PERIOD,
          pre_tax_amount: 25,
          pre_tax_amount_before_discount: 25,
        },
      ],
    },
    usage: { lineItems: [] },
  },
  projectedCosts: { projectedInRemainingCycle: 0, usage: { lineItems: [] } },
  minimum_fee: { expectedAtEndOfCycle: 0, floorPrice: null, prorated: false },
  prepaidCredits: { kind: 'without_forecast', actualWithdrawnInElapsedCycle: 0 },
  taxes: { status: 'not_applicable', expectedAtEndOfCycle: 0, percentage: 0 },
  total: { gross: { expectedAtEndOfCycle: 25 }, net: { expectedAtEndOfCycle: 25 } },
  ...details,
})

const mockUpcomingInvoice = (upcomingInvoice: UpcomingInvoiceData) => {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/billing/invoices/upcoming',
    response: () =>
      HttpResponse.json<UpcomingInvoiceResponse>({
        amount_total: 0,
        billing_cycle_start: PERIOD.start,
        billing_cycle_end: PERIOD.end,
        currency: 'usd',
        customer_balance: 0,
        fixed_fees_billing_mode: upcomingInvoice.fixed_fees_billing_mode,
        lines: [],
        subscription_id: 'sub_123',
        tax: null,
        tax_status: 'not_applicable',
        upcomingInvoice,
      }),
  })
}

const mockOrganization = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug',
    response: () =>
      HttpResponse.json<OrganizationSlugResponse>({
        id: 1,
        slug: ORG_SLUG,
        name: 'Test Org',
        plan: { id: 'pro', name: 'Pro' },
        billing_email: null,
        billing_partner: null,
        created_at: '2026-01-01T00:00:00Z',
        has_oriole_project: false,
        integration_source: null,
        opt_in_tags: [],
        restriction_data: null,
        restriction_status: null,
        usage_billing_enabled: true,
      }),
  })
}

const renderUpcomingInvoice = async (upcomingInvoice: UpcomingInvoiceData) => {
  mockOrganization()
  mockUpcomingInvoice(upcomingInvoice)

  customRender(<UpcomingInvoice slug={ORG_SLUG} />)
  // The invoice is only fetched once the component scrolls into view
  act(() => io.enterAll())

  await screen.findByText('Costs to Date')
}

describe('UpcomingInvoice', () => {
  test('shows costs to date, subtotal and the projected total with its due date', async () => {
    await renderUpcomingInvoice(createUpcomingInvoice())

    expect(screen.getByText('Pro Plan')).toBeInTheDocument()
    expect(screen.getByText('Subtotal')).toBeInTheDocument()
    expect(screen.getByText('Projected Total (due on December 1st)')).toBeInTheDocument()
    expect(screen.queryByText('Projected Costs')).not.toBeInTheDocument()
  })

  test('shows projected costs when usage is projected for the rest of the cycle', async () => {
    await renderUpcomingInvoice(
      createUpcomingInvoice({
        projectedCosts: {
          projectedInRemainingCycle: 12.5,
          usage: { lineItems: [createUsageLineItem({ name: 'IPv4', pre_tax_amount: 12.5 })] },
        },
      })
    )

    expect(screen.getByText('Projected Costs')).toBeInTheDocument()
    expect(screen.getByText('$12.50')).toBeInTheDocument()
  })

  test('shows an error when the invoice cannot be loaded', async () => {
    mockOrganization()
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/billing/invoices/upcoming',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 }),
    })

    customRender(<UpcomingInvoice slug={ORG_SLUG} />)
    act(() => io.enterAll())

    expect(await screen.findByText('Failed to retrieve upcoming invoice')).toBeInTheDocument()
  })

  test('shows the minimum fee top-up when costs are below the floor', async () => {
    await renderUpcomingInvoice(
      createUpcomingInvoice({
        minimum_fee: { expectedAtEndOfCycle: 7.5, floorPrice: 10, prorated: true },
      })
    )

    expect(screen.getByText('Minimum Fee (prorated)')).toBeInTheDocument()
    expect(screen.getByText('$7.50')).toBeInTheDocument()
  })

  test('shows the waived minimum fee when costs are above the floor', async () => {
    await renderUpcomingInvoice(
      createUpcomingInvoice({
        minimum_fee: { expectedAtEndOfCycle: 0, floorPrice: 10, prorated: false },
      })
    )

    expect(screen.getByText('Minimum Fee')).toBeInTheDocument()
    expect(screen.getByText('$10.00')).toHaveClass('line-through')
    expect(screen.getByText('$0.00')).not.toHaveClass('line-through')
  })

  test('hides the minimum fee when the plan has none', async () => {
    await renderUpcomingInvoice(createUpcomingInvoice())

    expect(screen.queryByText(/Minimum Fee/)).not.toBeInTheDocument()
  })

  test.each([
    {
      kind: 'with forecast',
      prepaidCredits: {
        kind: 'with_forecast',
        actualWithdrawnInElapsedCycle: 5,
        expectedWithdrawnAtEndOfCycle: 18,
        projectedWithdrawnInRemainingCycle: 13,
        currentBalance: 95,
        expectedBalanceAtEndOfCycle: 82,
      },
      expected: '-$18.00',
    },
    {
      kind: 'without forecast',
      prepaidCredits: { kind: 'without_forecast', actualWithdrawnInElapsedCycle: 5 },
      expected: '-$5.00',
    },
  ] as const)('deducts prepaid credits $kind', async ({ prepaidCredits, expected }) => {
    await renderUpcomingInvoice(createUpcomingInvoice({ prepaidCredits }))

    expect(screen.getByText('Prepaid Credits')).toBeInTheDocument()
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  test.each([
    { balance: -20, title: 'Account Balance', amount: '-$20.00' },
    { balance: 3, title: 'Owed Balance', amount: '$3.00' },
  ])('labels a customer balance of $balance as $title', async ({ balance, title, amount }) => {
    await renderUpcomingInvoice(createUpcomingInvoice({ appliedCustomerBalance: balance }))

    expect(screen.getByText(title)).toBeInTheDocument()
    expect(screen.getByText(amount)).toBeInTheDocument()
  })

  test('shows calculated tax with its rate', async () => {
    await renderUpcomingInvoice(
      createUpcomingInvoice({
        taxes: { status: 'calculated', expectedAtEndOfCycle: 2, percentage: 8 },
      })
    )

    expect(screen.getByText('Tax (8%)')).toBeInTheDocument()
    expect(screen.getByText('$2.00')).toBeInTheDocument()
  })

  test('shows tax without an amount when it could not be calculated', async () => {
    await renderUpcomingInvoice(
      createUpcomingInvoice({
        taxes: { status: 'failed', expectedAtEndOfCycle: 2, percentage: 8 },
      })
    )

    expect(screen.getByText('Tax')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tax could not be calculated' })).toBeInTheDocument()
    expect(screen.queryByText('Tax (8%)')).not.toBeInTheDocument()
    expect(screen.queryByText('$2.00')).not.toBeInTheDocument()
  })

  test('hides tax when it does not apply', async () => {
    await renderUpcomingInvoice(
      createUpcomingInvoice({
        taxes: { status: 'not_applicable', expectedAtEndOfCycle: 0, percentage: 0 },
      })
    )

    expect(screen.queryByText(/^Tax/)).not.toBeInTheDocument()
  })

  test('notes that the plan fee was paid in advance when it is missing from an in-arrears invoice', async () => {
    await renderUpcomingInvoice(
      createUpcomingInvoice({
        fixed_fees_billing_mode: 'in_arrears',
        currentCosts: {
          actualInElapsedCycle: 0,
          fixedFees: { lineItems: [] },
          usage: { lineItems: [] },
        },
      })
    )

    const note = await screen.findByText(/Plan fee for this period has already been paid/)
    await waitFor(() =>
      expect(note.closest('p')).toHaveTextContent(
        'Your Pro Plan fee for this period has already been paid.'
      )
    )
  })

  test('expands a usage line item into per-project usage', async () => {
    const user = userEvent.setup()
    await renderUpcomingInvoice(
      createUpcomingInvoice({
        currentCosts: {
          actualInElapsedCycle: 4.5,
          fixedFees: { lineItems: [] },
          usage: {
            lineItems: [
              createUsageLineItem({
                name: 'Egress',
                usage_unit: 'byte',
                pre_tax_amount: 4.5,
                pre_tax_amount_before_discount: 4.5,
                breakdown: [
                  {
                    project_name: 'Project A',
                    project_ref: 'project-a',
                    total_usage: 1_500_000_000,
                    total_pre_tax_amount: 4.5,
                    variants: [],
                  },
                ],
              }),
            ],
          },
        },
      })
    )

    expect(screen.queryByText('Project A')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Egress' }))

    expect(await screen.findByText('Project A')).toBeInTheDocument()
    expect(screen.getByText('(1.5 GB)')).toBeInTheDocument()
  })

  test('lists compute credits under a compute line item', async () => {
    const user = userEvent.setup()
    await renderUpcomingInvoice(
      createUpcomingInvoice({
        currentCosts: {
          actualInElapsedCycle: 0,
          fixedFees: { lineItems: [] },
          usage: { lineItems: [createComputeLineItem({ compute_credits_used: -10 })] },
        },
      })
    )

    expect(screen.queryByText('Compute Credits')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Compute Hours' }))

    expect(await screen.findByText('Compute Credits')).toBeInTheDocument()
    expect(screen.getByText('-$10.00')).toBeInTheDocument()
  })

  test('links a compute line item to the compute billing docs', async () => {
    await renderUpcomingInvoice(
      createUpcomingInvoice({
        currentCosts: {
          actualInElapsedCycle: 10,
          fixedFees: { lineItems: [] },
          usage: { lineItems: [createComputeLineItem()] },
        },
      })
    )

    expect(
      screen.getByRole('link', { name: 'Compute Hours billing docs (opens in a new tab)' })
    ).toHaveAttribute('href', expect.stringContaining('/guides/platform/manage-your-usage/compute'))
  })

  test.each([
    { shape: 'a plain row', breakdown: [] },
    {
      shape: 'an expandable row',
      breakdown: [
        {
          project_name: 'Project A',
          project_ref: 'project-a',
          total_usage: 1_500_000_000,
          total_pre_tax_amount: 4.5,
          variants: [],
        },
      ],
    },
  ])('links a usage line item to its billing docs as $shape', async ({ breakdown }) => {
    await renderUpcomingInvoice(
      createUpcomingInvoice({
        currentCosts: {
          actualInElapsedCycle: 4.5,
          fixedFees: { lineItems: [] },
          usage: {
            lineItems: [
              createUsageLineItem({
                name: 'Egress',
                usage_metric: 'EGRESS',
                usage_unit: 'byte',
                pre_tax_amount: 4.5,
                pre_tax_amount_before_discount: 4.5,
                breakdown,
              }),
            ],
          },
        },
      })
    )

    const docsLink = screen.getByRole('link', { name: 'Egress billing docs (opens in a new tab)' })
    expect(docsLink).toHaveAttribute(
      'href',
      expect.stringContaining('/guides/platform/manage-your-usage/egress')
    )
    expect(docsLink).toHaveAttribute('target', '_blank')
  })
})
