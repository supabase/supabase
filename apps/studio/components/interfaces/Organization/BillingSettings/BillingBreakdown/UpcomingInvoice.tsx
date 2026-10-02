import dayjs from 'dayjs'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, cn } from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import {
  UpcomingInvoiceResponse,
  useOrgUpcomingInvoiceQuery,
} from '@/data/invoices/org-invoice-upcoming-query'
import { useOrganizationQuery } from '@/data/organizations/organization-query'
import { formatCurrency } from '@/lib/helpers'

export interface UpcomingInvoiceProps {
  slug?: string
}

type UsageLineItem =
  UpcomingInvoiceResponse['upcomingInvoice']['currentCosts']['usage']['lineItems'][number]
type ProjectBreakdown = UsageLineItem['breakdown'][number]
type UsageUnit = Extract<UsageLineItem, { schema: 'compute' }>['usage_unit']

interface InvoiceLineItem {
  name: string
  description?: string
  pre_tax_amount: number
  pre_tax_amount_before_discount: number
  breakdown?: ProjectBreakdown[]
  compute_credits_used?: number | null
  usage_unit?: UsageUnit
  unit_price_desc?: string | null
}

export const UpcomingInvoice = ({ slug }: UpcomingInvoiceProps) => {
  const { ref, inView } = useInView({ triggerOnce: true })

  const {
    data: upcomingInvoice,
    error,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useOrgUpcomingInvoiceQuery({ orgSlug: slug }, { enabled: inView })

  const { data: organization } = useOrganizationQuery({ slug })

  const invoice = upcomingInvoice?.upcomingInvoice

  const hasMinimumFeeTopUp = (invoice?.minimum_fee.expectedAtEndOfCycle ?? 0) > 0
  // Once costs exceed the floor price there's no top-up; show the floor price crossed out instead
  const hasMetMinimumFee = !hasMinimumFeeTopUp && invoice?.minimum_fee.floorPrice != null
  // Without a forecast, only the credits applied so far are known
  const prepaidCreditsApplied =
    invoice?.prepaidCredits.kind === 'with_forecast'
      ? invoice.prepaidCredits.expectedWithdrawnAtEndOfCycle
      : (invoice?.prepaidCredits.actualWithdrawnInElapsedCycle ?? 0)
  const hasPrepaidCredits = prepaidCreditsApplied !== 0
  const hasAppliedCustomerBalance = (invoice?.appliedCustomerBalance ?? 0) !== 0
  const hasTax = invoice?.taxes.status === 'calculated'
  const hasProjectedCosts =
    (invoice?.projectedCosts.projectedInRemainingCycle ?? 0) !== 0 &&
    (invoice?.projectedCosts.usage.lineItems.length ?? 0) > 0
  const isPlanFeePaidInAdvance =
    invoice?.fixed_fees_billing_mode === 'in_arrears' &&
    invoice.currentCosts.fixedFees.lineItems.length === 0

  return (
    <div ref={ref}>
      {isLoading && (
        <div className="space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      )}

      {isError && <AlertError subject="Failed to retrieve upcoming invoice" error={error} />}

      {isSuccess && invoice && (
        <div className="w-full text-sm">
          <Accordion type="multiple" defaultValue={['current-costs']}>
            <InvoiceSection
              value="current-costs"
              title="Costs to Date"
              tooltip="Fixed fees for this billing cycle and usage costs accumulated from the start of the cycle up to now."
              amount={invoice.currentCosts.actualInElapsedCycle}
            >
              <InvoiceLineItemList
                lineItems={[
                  ...invoice.currentCosts.fixedFees.lineItems,
                  ...invoice.currentCosts.usage.lineItems,
                ]}
              />
            </InvoiceSection>

            {hasProjectedCosts && (
              <InvoiceSection
                value="projected-costs"
                title="Projected Costs"
                tooltip="Estimated costs for the rest of the billing cycle. Includes predictable costs like Compute Hours, IPv4, Custom Domain and Point-in-Time Recovery, but not usage-based metrics like MAU, storage or function invocations. Final amounts depend on your usage."
                amount={invoice.projectedCosts.projectedInRemainingCycle}
              >
                <InvoiceLineItemList lineItems={invoice.projectedCosts.usage.lineItems} />
              </InvoiceSection>
            )}
          </Accordion>

          {(hasMinimumFeeTopUp || hasMetMinimumFee) && (
            <InvoiceTotalRow
              title={invoice.minimum_fee.prorated ? 'Minimum Fee (prorated)' : 'Minimum Fee'}
              tooltip={getMinimumFeeTooltip(invoice.minimum_fee)}
              amount={invoice.minimum_fee.expectedAtEndOfCycle}
              amountBeforeDiscount={
                hasMetMinimumFee ? (invoice.minimum_fee.floorPrice ?? undefined) : undefined
              }
            />
          )}

          {hasPrepaidCredits && (
            <InvoiceTotalRow
              title="Prepaid Credits"
              tooltip={<PrepaidCreditsTooltip prepaidCredits={invoice.prepaidCredits} />}
              amount={-prepaidCreditsApplied}
            />
          )}

          <InvoiceTotalRow
            title="Subtotal"
            amount={invoice.total.gross.expectedAtEndOfCycle}
            isEmphasized
          />

          {hasTax && (
            <InvoiceTotalRow
              title={
                invoice.taxes.expectedAtEndOfCycle === 0
                  ? 'Tax'
                  : `Tax (${invoice.taxes.percentage}%)`
              }
              tooltip="Estimated based on your organization's billing address. The final amount may be adjusted at the end of the billing cycle."
              amount={invoice.taxes.expectedAtEndOfCycle}
            />
          )}

          {hasAppliedCustomerBalance && (
            <InvoiceTotalRow
              title={invoice.appliedCustomerBalance < 0 ? 'Account Balance' : 'Owed Balance'}
              tooltip={
                invoice.appliedCustomerBalance < 0
                  ? 'Credited balance from earlier billing changes, such as mid-cycle plan changes, applied to this invoice.'
                  : 'Owed balance from earlier billing changes or invoices that were too small to be charged directly.'
              }
              amount={invoice.appliedCustomerBalance}
            />
          )}

          <InvoiceTotalRow
            title={`Projected Total (due on ${dayjs(invoice.billing_cycle_end).format('MMMM Do')})`}
            tooltip="The amount we expect to charge at the end of the billing cycle. The final amount depends on your usage."
            amount={invoice.total.net.expectedAtEndOfCycle}
            isEmphasized
          />

          {isPlanFeePaidInAdvance && (
            <p className="pt-2 text-foreground-light text-xs text-right">
              Your {organization?.plan?.name && `${organization.plan.name} `}Plan fee for this
              period has already been paid. This invoice will only reflect usage charges.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function InvoiceAccordionHeader({
  title,
  tooltip,
  amount,
  className,
}: {
  title: string
  tooltip?: ReactNode
  amount: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Wrapper keeps the trigger content-sized so the tooltip (a button) can sit outside it */}
      <div>
        <AccordionTrigger
          hideIcon
          className="py-2 gap-1 justify-start font-[inherit] hover:no-underline [&[data-state=open]>svg]:rotate-90"
        >
          <ChevronRight
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-foreground-lighter transition-transform duration-200 motion-reduce:transition-none"
          />
          <span>{title}</span>
        </AccordionTrigger>
      </div>
      {tooltip && <InfoTooltip className="max-w-sm">{tooltip}</InfoTooltip>}
      <div className="ml-auto text-right" translate="no">
        {amount}
      </div>
    </div>
  )
}

function InvoiceSection({
  value,
  title,
  tooltip,
  amount,
  children,
}: {
  value: string
  title: string
  tooltip?: ReactNode
  amount: number
  children: ReactNode
}) {
  return (
    <AccordionItem value={value}>
      <InvoiceAccordionHeader
        title={title}
        tooltip={tooltip}
        amount={formatCurrency(amount) ?? '-'}
        className="font-medium"
      />
      <AccordionContent className="[&>div]:pb-2 pl-5">{children}</AccordionContent>
    </AccordionItem>
  )
}

function InvoiceLineItemList({ lineItems }: { lineItems: InvoiceLineItem[] }) {
  return (
    <Accordion type="multiple">
      {lineItems.map((item, index) => (
        <InvoiceLineItemRow
          key={`${item.description ?? item.name}-${index}`}
          value={`${item.description ?? item.name}-${index}`}
          item={item}
        />
      ))}
    </Accordion>
  )
}

function InvoiceLineItemRow({ value, item }: { value: string; item: InvoiceLineItem }) {
  const breakdown = item.breakdown ?? []
  // Compute line items have no description
  const title = item.description ?? item.name
  const hasComputeCredits = item.compute_credits_used != null
  const pricingTooltip = formatPricingTooltip(item.unit_price_desc)

  if (breakdown.length === 0 && !hasComputeCredits) {
    return (
      <InvoiceAmountRow
        title={title}
        tooltip={pricingTooltip}
        amount={item.pre_tax_amount}
        amountBeforeDiscount={item.pre_tax_amount_before_discount}
      />
    )
  }

  return (
    <AccordionItem value={value} className="border-b-0">
      <InvoiceAccordionHeader
        title={title}
        tooltip={pricingTooltip}
        amount={
          <InvoiceLineItemAmount
            amount={item.pre_tax_amount}
            amountBeforeDiscount={item.pre_tax_amount_before_discount}
          />
        }
      />
      <AccordionContent className="[&>div]:pb-0 pl-5">
        <Accordion type="multiple">
          {breakdown.map((project) => (
            <InvoiceProjectBreakdownRow
              key={project.project_ref}
              project={project}
              usageUnit={item.usage_unit}
            />
          ))}
        </Accordion>
        {hasComputeCredits && (
          // Credits are a deduction; normalize the sign regardless of how the API sends it
          <InvoiceAmountRow
            title="Compute Credits"
            amount={-Math.abs(item.compute_credits_used!)}
          />
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

function InvoiceProjectBreakdownRow({
  project,
  usageUnit,
}: {
  project: ProjectBreakdown
  usageUnit?: UsageUnit
}) {
  const amountBeforeDiscount = project.variants.reduce(
    (sum, variant) => sum + variant.pre_tax_amount_before_discount,
    0
  )
  const amount =
    project.total_pre_tax_amount ??
    project.variants.reduce((sum, variant) => sum + variant.pre_tax_amount, 0)

  if (project.variants.length === 0) {
    return (
      <InvoiceAmountRow
        title={project.project_name}
        detail={usageUnit && formatUsageWithUnit(project.total_usage, usageUnit)}
        amount={amount}
        amountBeforeDiscount={amountBeforeDiscount}
      />
    )
  }

  return (
    <AccordionItem value={project.project_ref} className="border-b-0">
      <InvoiceAccordionHeader
        title={project.project_name}
        amount={
          <InvoiceLineItemAmount amount={amount} amountBeforeDiscount={amountBeforeDiscount} />
        }
      />
      <AccordionContent className="[&>div]:pb-0 pl-5">
        {project.variants.map((variant) => (
          <InvoiceAmountRow
            key={variant.name}
            title={variant.name}
            detail={usageUnit && formatUsageWithUnit(variant.usage, usageUnit)}
            tooltip={formatPricingTooltip(variant.unit_price_desc)}
            amount={variant.pre_tax_amount}
            amountBeforeDiscount={variant.pre_tax_amount_before_discount}
          />
        ))}
      </AccordionContent>
    </AccordionItem>
  )
}

/** Leaf row, indented to line up with sibling accordion titles (chevron width + gap) */
function InvoiceAmountRow({
  title,
  detail,
  tooltip,
  amount,
  amountBeforeDiscount,
}: {
  title: string
  detail?: string
  tooltip?: ReactNode
  amount: number
  amountBeforeDiscount?: number
}) {
  const isFree = amount === 0 && !amountBeforeDiscount

  return (
    <div className="flex items-center justify-between py-2 pl-5">
      <div className="flex items-center gap-1">
        <span>
          {title}
          {detail && <span className="text-foreground-lighter"> ({detail})</span>}
        </span>
        {tooltip && <InfoTooltip className="max-w-sm">{tooltip}</InfoTooltip>}
      </div>
      {isFree ? (
        <span>-</span>
      ) : (
        <InvoiceLineItemAmount amount={amount} amountBeforeDiscount={amountBeforeDiscount} />
      )}
    </div>
  )
}

function PrepaidCreditsTooltip({
  prepaidCredits,
}: {
  prepaidCredits: UpcomingInvoiceResponse['upcomingInvoice']['prepaidCredits']
}) {
  return (
    <>
      <p>
        Prepaid credits are applied automatically against your invoice. Any remaining balance rolls
        over to the next billing cycle.
      </p>
      <p className="mt-2">
        {formatCurrency(prepaidCredits.actualWithdrawnInElapsedCycle)} of prepaid credits are
        already applied to your invoice.
        {prepaidCredits.kind === 'with_forecast' && (
          <PrepaidCreditsForecast prepaidCredits={prepaidCredits} />
        )}
        {prepaidCredits.kind === 'without_forecast' &&
          " We can't estimate how many more credits your usage will consume before the end of the billing cycle."}
      </p>
      <p className="mt-2">
        Credits for fixed fees, like your plan or the HIPAA add-on, are applied daily. The amount
        applied so far only covers the days elapsed in the current billing cycle.
      </p>
    </>
  )
}

function PrepaidCreditsForecast({
  prepaidCredits,
}: {
  prepaidCredits: Extract<
    UpcomingInvoiceResponse['upcomingInvoice']['prepaidCredits'],
    { kind: 'with_forecast' }
  >
}) {
  const hasProjectedWithdrawal = prepaidCredits.projectedWithdrawnInRemainingCycle > 0

  return (
    <>
      {` You currently have ${formatCurrency(prepaidCredits.currentBalance)} remaining.`}
      {hasProjectedWithdrawal &&
        ` We expect your usage to consume another ${formatCurrency(prepaidCredits.projectedWithdrawnInRemainingCycle)} of credits, which would leave you at ${formatCurrency(prepaidCredits.expectedBalanceAtEndOfCycle)} at the end of the billing cycle.`}
    </>
  )
}

function getMinimumFeeTooltip({
  expectedAtEndOfCycle,
  floorPrice,
}: UpcomingInvoiceResponse['upcomingInvoice']['minimum_fee']) {
  if (floorPrice === null) {
    return "If your costs for the billing cycle are below the minimum fee, you're charged the difference."
  }

  if (expectedAtEndOfCycle === 0) {
    return `Your costs are above your plan's minimum fee of ${formatCurrency(floorPrice)} per billing cycle, so no minimum fee applies.`
  }

  return `Your plan has a minimum fee of ${formatCurrency(floorPrice)} per billing cycle. If your costs are below it, you're charged the difference.`
}

function formatPricingTooltip(unitPriceDesc?: string | null) {
  if (!unitPriceDesc) return undefined
  return <span translate="no">Pricing: {unitPriceDesc}</span>
}

function InvoiceTotalRow({
  title,
  tooltip,
  amount,
  amountBeforeDiscount,
  isEmphasized = false,
}: {
  title: string
  tooltip?: ReactNode
  amount?: number
  amountBeforeDiscount?: number
  isEmphasized?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-2 border-b',
        isEmphasized && 'font-medium'
      )}
    >
      <div className="flex items-center gap-1">
        <span>{title}</span>
        {tooltip && <InfoTooltip className="max-w-sm">{tooltip}</InfoTooltip>}
      </div>
      {amount !== undefined && amountBeforeDiscount !== undefined ? (
        <InvoiceLineItemAmount amount={amount} amountBeforeDiscount={amountBeforeDiscount} />
      ) : (
        <span className="text-right" translate="no">
          {amount === undefined ? '-' : (formatCurrency(amount) ?? '-')}
        </span>
      )}
    </div>
  )
}

function InvoiceLineItemAmount({
  amountBeforeDiscount,
  amount,
}: {
  amountBeforeDiscount?: number
  amount: number
}) {
  if (amountBeforeDiscount && amount < amountBeforeDiscount) {
    return (
      <div>
        <span className="text-foreground-light line-through mr-2" translate="no">
          {formatCurrency(amountBeforeDiscount)}
        </span>
        <span translate="no">{formatCurrency(amount)}</span>
      </div>
    )
  }

  return <span translate="no">{formatCurrency(amount)}</span>
}

const USAGE_UNIT_LABELS: Record<
  Exclude<UsageUnit, 'byte'>,
  { singular: string; plural: string } | null
> = {
  gigabyte: { singular: 'GB', plural: 'GB' },
  hour: { singular: 'hour', plural: 'hours' },
  gbhr: { singular: 'GB-hour', plural: 'GB-hours' },
  mbpshr: { singular: 'Mbps-hour', plural: 'Mbps-hours' },
  iopshr: { singular: 'IOPS-hour', plural: 'IOPS-hours' },
  // Counts (invocations, MAU, messages, …) read fine as a bare number
  count: null,
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

// Above this, full numbers get hard to scan (e.g. IOPS-hours), so switch to 2.2M-style notation
const COMPACT_NOTATION_THRESHOLD = 1_000_000

function formatNumber(value: number) {
  // Avoid very low usage displaying as "0"
  if (value > 0 && value < 0.01) return '<0.01'

  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    notation: Math.abs(value) >= COMPACT_NOTATION_THRESHOLD ? 'compact' : 'standard',
  })
}

/** Decimal (base 1000) units, matching how usage is billed — unlike `formatBytes` (base 1024) */
function formatDecimalBytes(bytes: number) {
  if (bytes === 0) return '0 B'

  const exponent = Math.min(Math.floor(Math.log10(Math.abs(bytes)) / 3), BYTE_UNITS.length - 1)
  return `${formatNumber(bytes / 1000 ** Math.max(exponent, 0))} ${BYTE_UNITS[Math.max(exponent, 0)]}`
}

function formatUsageWithUnit(usage: number, unit: UsageUnit) {
  if (unit === 'byte') return formatDecimalBytes(usage)

  const formattedUsage = formatNumber(usage)
  const label = USAGE_UNIT_LABELS[unit]
  if (!label) return formattedUsage

  return `${formattedUsage} ${usage === 1 ? label.singular : label.plural}`
}
