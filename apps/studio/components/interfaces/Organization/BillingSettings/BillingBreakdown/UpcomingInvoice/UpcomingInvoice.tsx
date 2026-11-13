import dayjs from 'dayjs'
import { AlertTriangleIcon, ChevronRightIcon, ExternalLinkIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import type {
  UpcomingInvoiceAnyLineItem,
  UpcomingInvoiceData,
  UpcomingInvoiceProjectBreakdown,
  UpcomingInvoiceUsageUnit,
} from './types'
import { formatUsageWithUnit, getLineItemDocsLink } from './utils'
import { AlertError } from '@/components/ui/AlertError'
import { useOrgUpcomingInvoiceQuery } from '@/data/invoices/org-invoice-upcoming-query'
import { useOrganizationQuery } from '@/data/organizations/organization-query'
import { formatCurrency } from '@/lib/helpers'

export interface UpcomingInvoiceProps {
  slug: string
}

export const UpcomingInvoice = ({ slug }: UpcomingInvoiceProps) => {
  const { ref, inView } = useInView({ triggerOnce: true })

  const {
    data,
    error,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useOrgUpcomingInvoiceQuery({ orgSlug: slug }, { enabled: inView })

  const { data: organization } = useOrganizationQuery({ slug })

  if (isLoading) {
    return (
      <div ref={ref}>
        <div className="space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div ref={ref}>
        <AlertError subject="Failed to retrieve upcoming invoice" error={error} />
      </div>
    )
  }

  // just satisfying compiler
  if (!data?.upcomingInvoice || !isSuccess) {
    return <div ref={ref}></div>
  }

  const invoice = data.upcomingInvoice

  const hasMinimumFeeTopUp = invoice.minimum_fee.expectedAtEndOfCycle > 0

  const hasMetMinimumFeeThreshold = !hasMinimumFeeTopUp && invoice.minimum_fee.floorPrice != null

  const prepaidCreditsApplied =
    invoice.prepaidCredits.kind === 'with_forecast'
      ? invoice.prepaidCredits.expectedWithdrawnAtEndOfCycle
      : invoice.prepaidCredits.actualWithdrawnInElapsedCycle

  const hasPrepaidCredits = prepaidCreditsApplied !== 0

  const hasAppliedCustomerBalance = invoice.appliedCustomerBalance !== 0

  const taxesWereCalculated = invoice.taxes.status === 'calculated'
  const taxCalculationHasFailed = invoice.taxes.status === 'failed'

  const hasProjectedCosts =
    invoice.projectedCosts.projectedInRemainingCycle !== 0 &&
    invoice.projectedCosts.usage.lineItems.length > 0

  const isPlanFeePaidInAdvance =
    invoice.fixed_fees_billing_mode === 'in_arrears' &&
    invoice.currentCosts.fixedFees.lineItems.length === 0

  const currentFixedFeeLineItems = invoice.currentCosts.fixedFees.lineItems.map((item) => ({
    ...item,
    line_item_kind: 'fixed-fee' as const,
  }))
  const currentUsageLineItems = invoice.currentCosts.usage.lineItems.map((item) => ({
    ...item,
    line_item_kind: 'usage' as const,
  }))
  const allCurrentLineItems = [currentFixedFeeLineItems, currentUsageLineItems].flat()
  const projectedUsageLineItems = invoice.projectedCosts.usage.lineItems.map((item) => ({
    ...item,
    line_item_kind: 'usage' as const,
  }))

  return (
    <div ref={ref} className="w-full text-sm">
      <Accordion type="multiple" defaultValue={['current-costs']}>
        <InvoiceSection
          value="current-costs"
          title="Costs to Date"
          tooltip="Fixed fees and usage costs accumulated from the start of the billing cycle up until now."
          amount={invoice.currentCosts.actualInElapsedCycle}
        >
          <InvoiceLineItemList lineItems={allCurrentLineItems} />
        </InvoiceSection>

        {hasProjectedCosts && (
          <InvoiceSection
            value="projected-costs"
            title="Projected Costs"
            tooltip="Estimated costs for the rest of the billing cycle. Includes predictable costs like Compute Hours, IPv4, Custom Domain and Point-in-Time Recovery. Does not include usage-based metrics like MAU, storage or function invocations. Final amounts depend on your usage."
            amount={invoice.projectedCosts.projectedInRemainingCycle}
          >
            <InvoiceLineItemList lineItems={projectedUsageLineItems} />
          </InvoiceSection>
        )}
      </Accordion>

      {(hasMinimumFeeTopUp || hasMetMinimumFeeThreshold) && (
        <InvoiceTotalRow
          title={invoice.minimum_fee.prorated ? 'Minimum Fee (prorated)' : 'Minimum Fee'}
          tooltip={getMinimumFeeTooltip(invoice.minimum_fee)}
          amount={invoice.minimum_fee.expectedAtEndOfCycle}
          amountBeforeDiscount={
            hasMetMinimumFeeThreshold ? (invoice.minimum_fee.floorPrice ?? undefined) : undefined
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

      {taxesWereCalculated && (
        <InvoiceTotalRow
          title={
            invoice.taxes.expectedAtEndOfCycle === 0 ? 'Tax' : `Tax (${invoice.taxes.percentage}%)`
          }
          tooltip="Estimated based on your organization's billing address. The final amount may differ at the end of the billing cycle."
          amount={invoice.taxes.expectedAtEndOfCycle}
        />
      )}
      {taxCalculationHasFailed && (
        <InvoiceFailedToCalculateRow
          title={'Tax'}
          tooltip="We couldn't estimate tax for your organization right now. Make sure your billing address in your organization's billing settings is complete and correct."
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

      {/* Format in UTC so the due date matches the date on the invoice PDF, regardless of the viewer's timezone */}
      <InvoiceTotalRow
        title={`Projected Total (due on ${dayjs.utc(invoice.billing_cycle_end).format('MMMM Do')})`}
        tooltip="The estimated amount we expect to charge at the end of the billing cycle. The final amount depends on your usage."
        amount={invoice.total.net.expectedAtEndOfCycle}
        isEmphasized
      />

      {isPlanFeePaidInAdvance && (
        <p className="pt-2 text-foreground-light text-xs text-right">
          <span>Your </span>
          {organization?.plan?.name && <span>{organization.plan.name} </span>}
          <span>
            Plan fee for this period has already been paid. This invoice will only reflect usage
            charges.
          </span>
        </p>
      )}
    </div>
  )
}

function InvoiceAccordionHeader({
  title,
  tooltip,
  docsUrl,
  amount,
  className,
}: {
  title: string
  tooltip?: ReactNode
  docsUrl?: string
  amount: ReactNode
  className?: string
}) {
  return (
    <div className={cn('group/invoice-row flex items-center gap-1', className)}>
      <div>
        <AccordionTrigger
          hideIcon
          className="py-2 gap-1 justify-start hover:no-underline [&[data-state=open]>svg]:rotate-90"
        >
          <ChevronRightIcon
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-foreground-lighter transition-transform duration-200 motion-reduce:transition-none"
          />
          <span>{title}</span>
        </AccordionTrigger>
      </div>
      {tooltip && <InfoTooltip className="max-w-sm">{tooltip}</InfoTooltip>}
      {docsUrl && <UsageDocsLink href={docsUrl} title={title} />}
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

function InvoiceLineItemList({ lineItems }: { lineItems: UpcomingInvoiceAnyLineItem[] }) {
  return (
    <Accordion type="multiple">
      {lineItems.map((item, index) => {
        const key = item.name + '-' + index

        return <InvoiceLineItemRow key={key} accordionItemValue={key} item={item} />
      })}
    </Accordion>
  )
}

function InvoiceLineItemRow({
  accordionItemValue,
  item,
}: {
  item: UpcomingInvoiceAnyLineItem
  accordionItemValue: string
}) {
  if (item.line_item_kind === 'fixed-fee') {
    return (
      <InvoiceAmountRow
        title={item.description}
        amount={item.pre_tax_amount}
        amountBeforeDiscount={item.pre_tax_amount_before_discount}
      />
    )
  }

  const title = item.name

  const pricingTooltip =
    item.schema === 'generic' && item.unit_price_desc
      ? formatPricingTooltip(item.unit_price_desc)
      : undefined

  const docsUrl = getLineItemDocsLink(item)

  const hasComputeCredits =
    item.schema === 'compute' && typeof item.compute_credits_used === 'number'

  if (item.breakdown.length > 0 || hasComputeCredits) {
    return (
      <AccordionItem value={accordionItemValue} className="border-b-0">
        <InvoiceAccordionHeader
          title={title}
          tooltip={pricingTooltip}
          docsUrl={docsUrl}
          amount={
            <InvoiceLineItemAmount
              amount={item.pre_tax_amount}
              amountBeforeDiscount={item.pre_tax_amount_before_discount}
            />
          }
        />
        <AccordionContent className="[&>div]:pb-0 pl-5">
          {item.breakdown.length > 0 && (
            <Accordion type="multiple">
              {item.breakdown.map((project) => (
                <InvoiceProjectBreakdownRow
                  key={project.project_ref}
                  project={project}
                  usageUnit={item.usage_unit}
                />
              ))}
            </Accordion>
          )}
          {hasComputeCredits && (
            // always normalize compute credits to negative
            <InvoiceAmountRow
              title="Compute Credits"
              amount={-Math.abs(item.compute_credits_used!)}
            />
          )}
        </AccordionContent>
      </AccordionItem>
    )
  }

  return (
    <InvoiceAmountRow
      title={title}
      tooltip={pricingTooltip}
      docsUrl={docsUrl}
      amount={item.pre_tax_amount}
      amountBeforeDiscount={item.pre_tax_amount_before_discount}
    />
  )
}

function InvoiceProjectBreakdownRow({
  project,
  usageUnit,
}: {
  project: UpcomingInvoiceProjectBreakdown
  usageUnit?: UpcomingInvoiceUsageUnit
}) {
  const amountBeforeDiscount = +project.variants
    .reduce((sum, variant) => sum + variant.pre_tax_amount_before_discount, 0)
    .toFixed(2)

  const amount =
    project.total_pre_tax_amount ??
    +project.variants.reduce((sum, variant) => sum + variant.pre_tax_amount, 0).toFixed(2)

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
            tooltip={
              variant.unit_price_desc ? formatPricingTooltip(variant.unit_price_desc) : undefined
            }
            amount={variant.pre_tax_amount}
            amountBeforeDiscount={variant.pre_tax_amount_before_discount}
          />
        ))}
      </AccordionContent>
    </AccordionItem>
  )
}

function InvoiceAmountRow({
  title,
  detail,
  tooltip,
  docsUrl,
  amount,
  amountBeforeDiscount,
}: {
  title: string
  detail?: string
  tooltip?: ReactNode
  docsUrl?: string
  amount: number
  amountBeforeDiscount?: number
}) {
  const isFree = amount === 0 && !amountBeforeDiscount

  return (
    <div className="group/invoice-row flex items-center justify-between py-2 pl-5">
      <div className="flex items-center gap-1">
        <span>
          {title}
          {detail && <span className="text-foreground-lighter"> ({detail})</span>}
        </span>
        {tooltip && <InfoTooltip className="max-w-sm">{tooltip}</InfoTooltip>}
        {docsUrl && <UsageDocsLink href={docsUrl} title={title} />}
      </div>
      {isFree ? (
        <span>-</span>
      ) : (
        <InvoiceLineItemAmount amount={amount} amountBeforeDiscount={amountBeforeDiscount} />
      )}
    </div>
  )
}

function UsageDocsLink({ href, title }: { href: string; title: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${title} billing docs (opens in a new tab)`}
      className={cn(
        'flex rounded-sm text-foreground-lighter transition hover:text-foreground focus-ring',
        // Revealed on row hover; always visible on touch devices, which can't hover
        'opacity-0 group-hover/invoice-row:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100'
      )}
    >
      <ExternalLinkIcon aria-hidden="true" size={14} strokeWidth={2} />
    </a>
  )
}

function InvoiceFailedToCalculateRow({
  title,
  tooltip,
  isEmphasized = false,
}: {
  title: string
  tooltip: ReactNode
  isEmphasized?: boolean
}) {
  return (
    <div
      className={cn('flex items-center justify-between py-2 border-b', isEmphasized && 'font-bold')}
    >
      <div className="flex items-center gap-1">
        <span>{title}</span>
        <Tooltip>
          <TooltipTrigger type="button" className="flex">
            <AlertTriangleIcon
              aria-hidden="true"
              className="text-warning"
              size={14}
              strokeWidth={2}
            />
            <span className="sr-only">{`${title} could not be calculated`}</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">{tooltip}</TooltipContent>
        </Tooltip>
      </div>
      <span aria-hidden="true">-</span>
      <span className="sr-only">Not available</span>
    </div>
  )
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
  amount: number
  amountBeforeDiscount?: number
  isEmphasized?: boolean
}) {
  return (
    <div
      className={cn('flex items-center justify-between py-2 border-b', isEmphasized && 'font-bold')}
    >
      <div className="flex items-center gap-1">
        <span>{title}</span>
        {tooltip && <InfoTooltip className="max-w-sm">{tooltip}</InfoTooltip>}
      </div>
      <InvoiceLineItemAmount amount={amount} amountBeforeDiscount={amountBeforeDiscount} />
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

function PrepaidCreditsTooltip({
  prepaidCredits,
}: {
  prepaidCredits: UpcomingInvoiceData['prepaidCredits']
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
        {prepaidCredits.kind === 'without_forecast' && (
          <span>
            {' '}
            We can't estimate accurately how many credits you will consume before the billing cycle
            ends.
          </span>
        )}
      </p>
      <p className="mt-2">
        Credits for fixed fees, like your plan or the HIPAA add-on, are applied daily. The current
        amount only covers the days elapsed in the current billing cycle.
      </p>
    </>
  )
}

function PrepaidCreditsForecast({
  prepaidCredits,
}: {
  prepaidCredits: Extract<UpcomingInvoiceData['prepaidCredits'], { kind: 'with_forecast' }>
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
}: UpcomingInvoiceData['minimum_fee']) {
  if (floorPrice === null) {
    return "If your costs for the billing cycle are below the minimum fee, you're charged the difference."
  }

  if (expectedAtEndOfCycle === 0) {
    return `Your costs are above your plan's minimum fee of ${formatCurrency(floorPrice)} per billing cycle, so no minimum fee applies.`
  }

  return `Your plan has a minimum fee of ${formatCurrency(floorPrice)} per billing cycle. If your costs are below it, you're charged the difference.`
}

function formatPricingTooltip(unitPriceDesc: string) {
  return <span translate="no">Pricing: {unitPriceDesc}</span>
}
