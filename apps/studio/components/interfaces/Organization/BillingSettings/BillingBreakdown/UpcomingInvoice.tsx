import type { ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'
import { cn, Table, TableBody, TableCell, TableFooter, TableRow } from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import { useOrgUpcomingInvoiceQuery } from '@/data/invoices/org-invoice-upcoming-query'
import { useOrganizationQuery } from '@/data/organizations/organization-query'
import { formatCurrency } from '@/lib/helpers'

export interface UpcomingInvoiceProps {
  slug?: string
}

interface InvoiceLineItem {
  name: string
  pre_tax_amount: number
  pre_tax_amount_before_discount: number
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

  const hasPrepaidCredits = (invoice?.prepaidCredits.expectedWithdrawnAtEndOfCycle ?? 0) !== 0
  const hasAppliedCustomerBalance = (invoice?.appliedCustomerBalance ?? 0) !== 0
  const hasTax = invoice?.taxes.status === 'calculated' && invoice.taxes.expectedAtEndOfCycle > 0
  const hasTaxFailed = invoice?.taxes.status === 'failed'
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
        <Table className="w-full text-sm">
          <TableBody>
            <InvoiceSectionRow
              title="Current Costs"
              tooltip="Costs accumulated from the beginning of the billing cycle up to now."
              amount={invoice.currentCosts.actualInElapsedCycle}
            />
            <InvoiceCategory
              title="Fixed Fees"
              lineItems={invoice.currentCosts.fixedFees.lineItems}
            />
            <InvoiceCategory title="Usage" lineItems={invoice.currentCosts.usage.lineItems} />

            <InvoiceSectionRow
              title="Projected Costs"
              tooltip="Projected costs for the remainder of the billing cycle. Includes predictable costs for Compute Hours, IPv4, Custom Domain and Point-In-Time-Recovery, but no costs for metrics like MAU, storage or function invocations. Final amounts may vary depending on your usage."
              amount={invoice.projectedCosts.projectedInRemainingCycle}
            />
            <InvoiceCategory title="Usage" lineItems={invoice.projectedCosts.usage.lineItems} />
          </TableBody>

          <TableFooter>
            {hasPrepaidCredits && (
              <InvoiceTotalRow
                title="Prepaid Credits"
                tooltip="Prepaid credits purchased upfront, applied automatically against your invoice. Any remaining balance rolls over to the next billing cycle."
                amount={-invoice.prepaidCredits.expectedWithdrawnAtEndOfCycle}
              />
            )}

            <InvoiceTotalRow
              title="Pre-tax Total"
              amount={invoice.total.gross.expectedAtEndOfCycle}
              isEmphasized
            />

            {hasTax && (
              <InvoiceTotalRow
                title={`Tax (${invoice.taxes.percentage}%)`}
                tooltip="Estimated based on your organization's billing address. The final amount may be adjusted at the end of the billing cycle."
                amount={invoice.taxes.expectedAtEndOfCycle}
              />
            )}

            {hasTaxFailed && (
              <InvoiceTotalRow
                title="Tax"
                tooltip={
                  <p className="text-warning">
                    We were unable to estimate tax for your organization. Please verify your billing
                    address in your organization settings.
                  </p>
                }
              />
            )}

            {hasAppliedCustomerBalance && (
              <InvoiceTotalRow
                title="Applied Customer Balance"
                amount={invoice.appliedCustomerBalance}
              />
            )}

            <InvoiceTotalRow
              title="Net Total"
              amount={invoice.total.net.expectedAtEndOfCycle}
              isEmphasized
            />

            {isPlanFeePaidInAdvance && (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell
                  className="pt-2! pb-0! px-0 text-foreground-light text-xs text-right"
                  colSpan={2}
                >
                  Your {organization?.plan?.name && `${organization.plan.name} `}Plan fee for this
                  period has already been paid. This invoice will only reflect usage charges.
                </TableCell>
              </TableRow>
            )}
          </TableFooter>
        </Table>
      )}
    </div>
  )
}

function InvoiceSectionRow({
  title,
  tooltip,
  amount,
}: {
  title: string
  tooltip?: ReactNode
  amount: number
}) {
  return (
    <TableRow>
      <TableCell className="font-medium py-2 px-0">
        <div className="flex items-center gap-1">
          <span>{title}</span>
          {tooltip && <InfoTooltip className="max-w-sm">{tooltip}</InfoTooltip>}
        </div>
      </TableCell>
      <TableCell className="text-right font-medium py-2 px-0" translate="no">
        {formatCurrency(amount) ?? '-'}
      </TableCell>
    </TableRow>
  )
}

function InvoiceCategory({ title, lineItems }: { title: string; lineItems: InvoiceLineItem[] }) {
  if (lineItems.length === 0) return null

  return (
    <>
      <TableRow className="hover:bg-transparent">
        <TableCell className="py-2 px-0 pl-4 text-foreground-light text-xs" colSpan={2}>
          {title}
        </TableCell>
      </TableRow>
      {lineItems.map((item) => (
        <TableRow key={item.name}>
          <TableCell className="py-2 px-0 pl-8">{item.name}</TableCell>
          <TableCell className="text-right py-2 px-0">
            {item.pre_tax_amount === 0 ? (
              '-'
            ) : (
              <InvoiceLineItemAmount
                amount={item.pre_tax_amount}
                amountBeforeDiscount={item.pre_tax_amount_before_discount}
              />
            )}
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

function InvoiceTotalRow({
  title,
  tooltip,
  amount,
  isEmphasized = false,
}: {
  title: string
  tooltip?: ReactNode
  amount?: number
  isEmphasized?: boolean
}) {
  return (
    <TableRow>
      <TableCell className={cn('py-2 px-0', isEmphasized && 'font-medium')}>
        <div className="flex items-center gap-1">
          <span>{title}</span>
          {tooltip && <InfoTooltip className="max-w-sm">{tooltip}</InfoTooltip>}
        </div>
      </TableCell>
      <TableCell
        className={cn('text-right py-2 px-0', isEmphasized && 'font-medium')}
        translate="no"
      >
        {amount === undefined ? '-' : (formatCurrency(amount) ?? '-')}
      </TableCell>
    </TableRow>
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
