import type { OrganizationBillingSubscriptionPreviewData } from '@/data/organizations/organization-billing-subscription-preview'
import type { OrgProject } from '@/data/projects/org-projects-infinite-query'
import { PROJECT_STATUS } from '@/lib/constants'
import { formatCurrency } from '@/lib/helpers'

/**
 * Hours a compute instance bills for in a month. Compute is billed hourly and the
 * platform prices a full month as 744 hours, so a $10/mo project is $10/744 per hour.
 * Only used to present the monthly compute price as an hourly rate — every amount
 * the customer is charged comes from the subscription preview.
 */
const BILLABLE_HOURS_PER_MONTH = 744

const hourlyRateFormatter = Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 5,
})

/** Compute rates run to fractions of a cent, so `formatCurrency` rounds them away. */
export const formatHourlyRate = (amount: number) => hourlyRateFormatter.format(amount)

/**
 * Every amount on the plan change screen, rounded to the nearest dollar but still written
 * with cents, so the bill reads as $10.00 rather than $9.81. Hourly compute rates are the
 * one exception — see `formatHourlyRate`.
 *
 * Note this applies to Due today as well, so the figure shown there and on the confirm
 * button can differ by up to 50 cents from what Stripe actually charges.
 */
export const formatRoundedCurrency = (amount: number) => formatCurrency(Math.round(amount))

type SubscriptionPreview = OrganizationBillingSubscriptionPreviewData
type BreakdownItem = NonNullable<SubscriptionPreview>['breakdown'][number]

export interface ComputeProjectLine {
  ref: string
  name: string
  /** Monthly compute price for this project, before the plan's compute credit. */
  amount: number
  /** True when the plan's included compute credit pays for this project. */
  isCovered: boolean
}

export interface AddonLine {
  /** The line item's own name, e.g. "IPv4" or "7-days PITR". */
  description: string
  amount: number
  /** Projects the add-on is active on, 0 when the item is not per-project. */
  projectCount: number
  /** Stripe's own wording for the rate, e.g. "$0.0055 per hour". */
  unitPriceDesc?: string
}

export interface PlanChangeSummary {
  /** Monthly price of the plan being moved to. */
  planAmount: number
  /** Compute charged on top of the plan, i.e. compute line items minus the compute credit. */
  computeTotal: number
  computeProjects: ComputeProjectLine[]
  /** Monthly compute price of one project, used for the "each new project" row. */
  perProjectMonthlyPrice: number | null
  /** `perProjectMonthlyPrice` expressed as the hourly rate compute actually bills at. */
  perProjectHourlyRate: number | null
  /**
   * Everything on the new invoice that is neither the plan nor compute — paid add-ons
   * like IPv4 and PITR, and any usage items. Without these the rows above the monthly
   * total would not add up to it.
   */
  addons: AddonLine[]
  /** Projects the organization will be billed for on the new plan. */
  projectCount: number
  /** Every line item on the new monthly invoice, including usage items. */
  monthlyTotal: number
}

const isPlanItem = (item: BreakdownItem) => item.description?.toLowerCase().includes('plan')

const isComputeCreditItem = (item: BreakdownItem) =>
  item.description?.toLowerCase().startsWith('compute credit')

/** Compute line items carry a per-project breakdown; the compute credit does not. */
const isComputeItem = (item: BreakdownItem) =>
  item.description?.toLowerCase().includes('compute') && !isComputeCreditItem(item)

/**
 * Splits the subscription preview's flat line items into the plan / compute / total
 * shape the upgrade screen presents, and works out which projects the plan's included
 * compute credit pays for.
 */
export function getPlanChangeSummary(
  preview: SubscriptionPreview | undefined,
  { fallbackPlanAmount = 0 }: { fallbackPlanAmount?: number } = {}
): PlanChangeSummary {
  const breakdown = preview?.breakdown ?? []

  const planAmount = breakdown.find(isPlanItem)?.total_price ?? fallbackPlanAmount
  const computeItems = breakdown.filter(isComputeItem)
  const computeCredit = Math.abs(
    breakdown.filter(isComputeCreditItem).reduce((sum, item) => sum + item.total_price, 0)
  )

  const projects = computeItems.flatMap((item) => {
    const entries = item.breakdown ?? []
    return entries.map((entry) => ({
      ref: entry.project_ref,
      name: entry.project_name,
      // `amount` is optional on the API type; an even split across the item's projects
      // is the same number for the uniform-compute case this screen shows.
      amount: entry.amount ?? (entries.length > 0 ? item.total_price / entries.length : 0),
    }))
  })

  // The credit covers whole projects from the top of the list until it runs out.
  let remainingCredit = computeCredit
  const computeProjects: ComputeProjectLine[] = projects.map((project) => {
    const isCovered = project.amount > 0 && remainingCredit >= project.amount
    if (isCovered) remainingCredit -= project.amount
    return { ...project, isCovered }
  })

  const addons: AddonLine[] = breakdown
    .filter((item) => !isPlanItem(item) && !isComputeItem(item) && !isComputeCreditItem(item))
    .map((item) => ({
      description: item.description,
      amount: item.total_price,
      projectCount: item.breakdown?.length ?? 0,
      unitPriceDesc: item.unit_price_desc,
    }))

  const computeSubtotal = computeItems.reduce((sum, item) => sum + item.total_price, 0)
  const perProjectMonthlyPrice =
    computeProjects.length > 0 ? computeSubtotal / computeProjects.length : null

  return {
    planAmount,
    computeTotal: computeSubtotal - computeCredit,
    computeProjects,
    perProjectMonthlyPrice,
    perProjectHourlyRate:
      perProjectMonthlyPrice === null ? null : perProjectMonthlyPrice / BILLABLE_HOURS_PER_MONTH,
    addons,
    projectCount: preview?.number_of_projects ?? computeProjects.length,
    monthlyTotal: breakdown.reduce((sum, item) => sum + item.total_price, 0),
  }
}

export interface DueTodayBreakdown {
  /** Plan price before any credit, shown struck through when something reduces it. */
  planAmount: number
  /** Prepaid credit balance applied to this payment. */
  creditBalance: number
  /** Credit for time already paid for on the current plan. */
  proratedCredit: number
  tax: { amount: number; ratePercentage: number } | null
  /** Set when tax could not be calculated and may be charged separately. */
  isTaxEstimateUnavailable: boolean
  dueToday: number
  isReduced: boolean
}

export function getDueTodayBreakdown(
  preview: SubscriptionPreview | undefined,
  { planAmount }: { planAmount: number }
): DueTodayBreakdown {
  const upfrontCharge = preview?.upfront_charge
  const creditBalance = upfrontCharge?.customer_balance ?? 0
  const proratedCredit = upfrontCharge?.prorated_credit ?? 0
  const dueToday = upfrontCharge?.total ?? 0
  const taxAmount = upfrontCharge?.tax?.tax_amount ?? 0
  const hasTax = upfrontCharge?.tax_status === 'calculated' && taxAmount > 0

  return {
    planAmount,
    creditBalance,
    proratedCredit,
    tax: hasTax
      ? {
          amount: taxAmount,
          ratePercentage: upfrontCharge!.tax!.tax_rate_percentage,
        }
      : null,
    isTaxEstimateUnavailable: upfrontCharge?.tax_status === 'failed',
    dueToday,
    isReduced: dueToday < planAmount,
  }
}

export const getPausedProjects = (projects: OrgProject[]) =>
  projects.filter((project) => project.status === PROJECT_STATUS.INACTIVE)

export const getActiveProjects = (projects: OrgProject[]) =>
  projects.filter(
    (project) =>
      project.status === PROJECT_STATUS.ACTIVE_HEALTHY ||
      project.status === PROJECT_STATUS.COMING_UP
  )
