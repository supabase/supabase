import { describe, expect, it } from 'vitest'

import {
  formatRoundedCurrency,
  getDueTodayBreakdown,
  getPausedProjects,
  getPlanChangeSummary,
} from './PlanChangeSummary.utils'
import type { OrganizationBillingSubscriptionPreviewData } from '@/data/organizations/organization-billing-subscription-preview'
import type { OrgProject } from '@/data/projects/org-projects-infinite-query'

type SubscriptionPreview = NonNullable<OrganizationBillingSubscriptionPreviewData>

const computeProject = (ref: string, name: string, amount: number) => ({
  project_ref: ref,
  project_name: name,
  amount,
  usage: 744,
})

const createPreview = (overrides: Partial<SubscriptionPreview> = {}): SubscriptionPreview =>
  ({
    active_projects: [],
    billed_via_partner: false,
    breakdown: [],
    monthly_invoice_tax_status: 'calculated',
    number_of_projects: 0,
    pending_subscription_flow: true,
    plan_change_type: 'upgrade',
    slug: 'acme-org',
    upfront_charge: null,
    ...overrides,
  }) as SubscriptionPreview

describe('getPlanChangeSummary', () => {
  it('nets the compute credit off compute and marks the projects it covers', () => {
    const summary = getPlanChangeSummary(
      createPreview({
        breakdown: [
          { description: 'Pro Plan', total_price: 25 },
          {
            description: 'Micro Compute Hours',
            total_price: 20,
            breakdown: [computeProject('aaa', 'project-one', 10), computeProject('bbb', 'two', 10)],
          },
          { description: 'Compute Credits', total_price: -10 },
        ],
      })
    )

    expect(summary.planAmount).toBe(25)
    // Two projects at $10, one of them paid for by the $10 credit.
    expect(summary.computeTotal).toBe(10)
    expect(summary.computeProjects).toEqual([
      { ref: 'aaa', name: 'project-one', amount: 10, isCovered: true },
      { ref: 'bbb', name: 'two', amount: 10, isCovered: false },
    ])
    expect(summary.monthlyTotal).toBe(35)
  })

  it('derives the per-project hourly rate from the monthly compute price', () => {
    const summary = getPlanChangeSummary(
      createPreview({
        breakdown: [
          {
            description: 'Micro Compute Hours',
            total_price: 10,
            breakdown: [computeProject('aaa', 'project-one', 10)],
          },
        ],
      })
    )

    expect(summary.perProjectMonthlyPrice).toBe(10)
    expect(summary.perProjectHourlyRate).toBeCloseTo(0.01344, 5)
  })

  it('reports no compute for an organization without active projects', () => {
    const summary = getPlanChangeSummary(
      createPreview({ breakdown: [{ description: 'Pro Plan', total_price: 25 }] })
    )

    expect(summary.computeTotal).toBe(0)
    expect(summary.computeProjects).toEqual([])
    expect(summary.perProjectMonthlyPrice).toBeNull()
    expect(summary.perProjectHourlyRate).toBeNull()
    expect(summary.monthlyTotal).toBe(25)
  })

  it('itemizes add-ons and usage so the rows reconcile with the monthly total', () => {
    // Shape taken from a real Pro -> Team preview.
    const summary = getPlanChangeSummary(
      createPreview({
        breakdown: [
          { description: 'Team Plan', quantity: 1, total_price: 599 },
          { description: 'Compute Credits - Up to $10.00', total_price: -10 },
          {
            description: 'Micro Compute',
            unit_price_desc: '$0.01344 per hour',
            quantity: 1460,
            total_price: 20,
            breakdown: [
              computeProject('smezmsgdtwdrwjnigusf', 'starting on free 2', 9.8112),
              computeProject('ctrzmitwpuaezsnqfoxc', 'starting on free', 9.8112),
            ],
          },
          {
            description: 'IPv4',
            unit_price_desc: '$0.0055 per hour',
            quantity: 1460,
            total_price: 8.03,
            breakdown: [
              computeProject('smezmsgdtwdrwjnigusf', 'starting on free 2', 4.015),
              computeProject('ctrzmitwpuaezsnqfoxc', 'starting on free', 4.015),
            ],
          },
          {
            description: '7-days PITR',
            unit_price_desc: '$0.137 per hour',
            quantity: 730,
            total_price: 100.01,
            breakdown: [computeProject('smezmsgdtwdrwjnigusf', 'starting on free 2', 100.01)],
          },
        ],
      })
    )

    expect(summary.addons).toEqual([
      {
        description: 'IPv4',
        amount: 8.03,
        projectCount: 2,
        unitPriceDesc: '$0.0055 per hour',
      },
      {
        description: '7-days PITR',
        amount: 100.01,
        projectCount: 1,
        unitPriceDesc: '$0.137 per hour',
      },
    ])
    expect(summary.planAmount).toBe(599)
    expect(summary.computeTotal).toBeCloseTo(10, 5)

    // Plan + compute + add-ons is the whole invoice, with nothing unaccounted for.
    const rowTotal =
      summary.planAmount +
      summary.computeTotal +
      summary.addons.reduce((sum, addon) => sum + addon.amount, 0)
    expect(rowTotal).toBeCloseTo(summary.monthlyTotal, 5)
    expect(summary.monthlyTotal).toBeCloseTo(717.04, 5)
  })

  it('keeps a non-per-project line item without a project count', () => {
    const summary = getPlanChangeSummary(
      createPreview({ breakdown: [{ description: 'Egress', total_price: 4.5 }] })
    )

    expect(summary.addons).toEqual([
      { description: 'Egress', amount: 4.5, projectCount: 0, unitPriceDesc: undefined },
    ])
  })

  it('falls back to the plan price when the preview has not loaded', () => {
    expect(getPlanChangeSummary(undefined, { fallbackPlanAmount: 599 }).planAmount).toBe(599)
  })

  it('splits a compute item evenly when per-project amounts are missing', () => {
    const summary = getPlanChangeSummary(
      createPreview({
        breakdown: [
          {
            description: 'Micro Compute Hours',
            total_price: 30,
            breakdown: [
              { project_ref: 'a', project_name: 'a', usage: 744 },
              { project_ref: 'b', project_name: 'b', usage: 744 },
              { project_ref: 'c', project_name: 'c', usage: 744 },
            ],
          },
        ],
      })
    )

    expect(summary.computeProjects.map((project) => project.amount)).toEqual([10, 10, 10])
  })

  it('does not treat the compute credit as a compute line item', () => {
    const summary = getPlanChangeSummary(
      createPreview({ breakdown: [{ description: 'Compute Credits', total_price: -10 }] })
    )

    expect(summary.computeProjects).toEqual([])
    expect(summary.computeTotal).toBe(-10)
  })
})

describe('getDueTodayBreakdown', () => {
  it('reports a prepaid credit balance reducing the first payment', () => {
    const breakdown = getDueTodayBreakdown(
      createPreview({
        upfront_charge: {
          customer_balance: 10,
          prorated_credit: 0,
          tax: null,
          tax_status: 'not_applicable',
          taxable_amount: 25,
          total: 15,
        },
      }),
      { planAmount: 25 }
    )

    expect(breakdown).toMatchObject({
      planAmount: 25,
      creditBalance: 10,
      proratedCredit: 0,
      tax: null,
      dueToday: 15,
      isReduced: true,
    })
  })

  it('reports credit for unused time on the current plan', () => {
    const breakdown = getDueTodayBreakdown(
      createPreview({
        upfront_charge: {
          customer_balance: 0,
          prorated_credit: 16.13,
          tax: null,
          tax_status: 'not_applicable',
          taxable_amount: 599,
          total: 582.87,
        },
      }),
      { planAmount: 599 }
    )

    expect(breakdown.proratedCredit).toBe(16.13)
    expect(breakdown.dueToday).toBe(582.87)
    expect(breakdown.isReduced).toBe(true)
  })

  it('surfaces calculated tax and flags a failed tax estimate', () => {
    const withTax = getDueTodayBreakdown(
      createPreview({
        upfront_charge: {
          customer_balance: 0,
          prorated_credit: 0,
          tax: {
            currency: 'usd',
            tax_amount: 2.5,
            tax_rate_percentage: 10,
            total_amount_excluding_tax: 25,
            total_amount_including_tax: 27.5,
          },
          tax_status: 'calculated',
          taxable_amount: 25,
          total: 27.5,
        },
      }),
      { planAmount: 25 }
    )

    expect(withTax.tax).toEqual({ amount: 2.5, ratePercentage: 10 })
    expect(withTax.isReduced).toBe(false)

    const failedTax = getDueTodayBreakdown(
      createPreview({
        upfront_charge: {
          customer_balance: 0,
          prorated_credit: 0,
          tax: null,
          tax_status: 'failed',
          taxable_amount: 25,
          total: 25,
        },
      }),
      { planAmount: 25 }
    )

    expect(failedTax.isTaxEstimateUnavailable).toBe(true)
    expect(failedTax.tax).toBeNull()
  })

  it('is zeroed out while the preview is loading', () => {
    expect(getDueTodayBreakdown(undefined, { planAmount: 25 })).toMatchObject({
      dueToday: 0,
      creditBalance: 0,
      isReduced: true,
    })
  })
})

describe('getPausedProjects', () => {
  it('picks out only inactive projects', () => {
    const projects = [
      { ref: 'a', name: 'a', status: 'ACTIVE_HEALTHY' },
      { ref: 'b', name: 'b', status: 'INACTIVE' },
      { ref: 'c', name: 'c', status: 'COMING_UP' },
      { ref: 'd', name: 'd', status: 'INACTIVE' },
    ] as OrgProject[]

    expect(getPausedProjects(projects).map((project) => project.ref)).toEqual(['b', 'd'])
  })
})

describe('formatRoundedCurrency', () => {
  it('rounds to the nearest dollar but keeps the cents', () => {
    expect(formatRoundedCurrency(100.01)).toBe('$100.00')
    expect(formatRoundedCurrency(100.99)).toBe('$101.00')
    expect(formatRoundedCurrency(9.81)).toBe('$10.00')
    expect(formatRoundedCurrency(10)).toBe('$10.00')
    expect(formatRoundedCurrency(0)).toBe('$0.00')
    expect(formatRoundedCurrency(10.4)).toBe('$10.00')
    expect(formatRoundedCurrency(12.75)).toBe('$13.00')
  })
})
