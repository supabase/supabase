import clsx from 'clsx'

import * as Tooltip from '@radix-ui/react-tooltip'
import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrgUpcomingInvoiceQuery } from 'data/invoices/org-invoice-upcoming-query'
import { formatCurrency } from 'lib/helpers'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Button, Collapsible } from 'ui'
import { billingMetricUnit, formatUsage } from '../helpers'
import { ChevronRight, Info } from 'lucide-react'

export interface UpcomingInvoiceProps {
  slug?: string
}

interface TooltipData {
  identifier: string
  text: string
  linkRef?: string
}

const feeTooltipData: TooltipData[] = [
  {
    identifier: 'COMPUTE',
    text: 'Every project is a dedicated server and database. For every hour your project is active, it incurs compute costs based on the compute size of your project. Paused projects do not incur compute costs.',
    linkRef:
      'https://supabase.com/docs/guides/platform/org-based-billing#billing-for-compute-compute-hours',
  },
]

const UpcomingInvoice = ({ slug }: UpcomingInvoiceProps) => {
  const {
    data: upcomingInvoice,
    error: error,
    isLoading,
    isError,
    isSuccess,
  } = useOrgUpcomingInvoiceQuery({ orgSlug: slug })

  const [usageFeesExpanded, setUsageFeesExpanded] = useState<string[]>([])

  const computeCredits = useMemo(() => {
    return (upcomingInvoice?.lines || []).find((item) =>
      item.description.startsWith('Compute Credits')
    )
  }, [upcomingInvoice])

  const fixedFees = useMemo(() => {
    return (upcomingInvoice?.lines || [])
      .filter((item) => item !== computeCredits && (!item.breakdown || !item.breakdown.length))
      .sort((a, b) => {
        // Prorations should be below regular usage fees
        return Number(a.proration) - Number(b.proration)
      })
  }, [upcomingInvoice, computeCredits])

  const feesWithBreakdown = useMemo(() => {
    return (upcomingInvoice?.lines || [])
      .filter((item) => item.breakdown?.length)
      .sort((a, b) => Number(a.usage_based) - Number(b.usage_based) || b.amount - a.amount)
  }, [upcomingInvoice])

  const expandUsageFee = (fee: string) => {
    setUsageFeesExpanded([...usageFeesExpanded, fee])
  }

  const collapseUsageFee = (fee: string) => {
    setUsageFeesExpanded(usageFeesExpanded.filter((item) => item !== fee))
  }

  const allFeesExpanded = useMemo(() => {
    return feesWithBreakdown.length === usageFeesExpanded.length
  }, [feesWithBreakdown, usageFeesExpanded])

  const toggleAllFees = () => {
    if (allFeesExpanded) {
      setUsageFeesExpanded([])
    } else {
      setUsageFeesExpanded(feesWithBreakdown.map((item) => item.description))
    }
  }

  return (
    <>
      {isLoading && (
        <div className="space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      )}

      {isError && <AlertError subject="Failed to retrieve upcoming invoice" error={error} />}

      {isSuccess && (
        <div>
          {feesWithBreakdown.length > 0 && (
            <div className="mb-2">
              <Button size="tiny" type="default" onClick={toggleAllFees}>
                {allFeesExpanded ? 'Collapse All' : 'Expand All'}
              </Button>
            </div>
          )}

          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-2 font-medium text-left text-sm text-foreground-light max-w-[200px]">
                  Item
                </th>
                <th className="py-2 font-medium text-right text-sm text-foreground-light pr-4">
                  Usage
                </th>
                <th className="py-2 font-medium text-left text-sm text-foreground-light">
                  Unit price
                </th>
                <th className="py-2 font-medium text-right text-sm text-foreground-light">Cost</th>
              </tr>
            </thead>
            <tbody>
              {fixedFees.map((item) => (
                <tr key={item.description} className="border-b">
                  <td className="py-2 text-sm max-w-[200px]" colSpan={item.proration ? 3 : 1}>
                    {item.description ?? 'Unknown'}
                  </td>
                  {!item.proration && (
                    <td className="py-2 text-sm text-right pr-4">
                      {item.quantity?.toLocaleString()}
                    </td>
                  )}
                  {!item.proration && (
                    <td className="py-2 text-sm">
                      {item.unit_price === 0
                        ? 'FREE'
                        : item.unit_price
                          ? formatCurrency(item.unit_price)
                          : null}
                    </td>
                  )}
                  <td className="py-2 text-sm text-right">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>

            {feesWithBreakdown.length > 0 &&
              feesWithBreakdown.map((fee) => (
                <Collapsible
                  asChild
                  open={usageFeesExpanded.includes(fee.description)}
                  onOpenChange={(open) =>
                    open ? expandUsageFee(fee.description) : collapseUsageFee(fee.description)
                  }
                  key={fee.description}
                >
                  <tbody>
                    <Collapsible.Trigger asChild>
                      <tr
                        className={usageFeesExpanded.includes(fee.description) ? '' : 'border-b'}
                        key={fee.description}
                        style={{ WebkitAppearance: 'initial' }}
                      >
                        <td className="py-2 text-sm max-w-[200px]">
                          <Button
                            type="text"
                            className="!px-1"
                            icon={
                              <ChevronRight
                                className={clsx(
                                  'transition',
                                  usageFeesExpanded.includes(fee.description) && 'rotate-90'
                                )}
                              />
                            }
                          />{' '}
                          <span className="mr-2">
                            {fee.description}
                            {fee.usage_metric &&
                              billingMetricUnit(fee.usage_metric) &&
                              ` (${billingMetricUnit(fee.usage_metric)})`}
                          </span>
                          {(() => {
                            const matchingTooltipData = feeTooltipData.find((it) =>
                              fee.usage_metric?.startsWith(it.identifier)
                            )
                            return matchingTooltipData ? (
                              <InvoiceTooltip
                                text={matchingTooltipData.text}
                                linkRef={matchingTooltipData.linkRef}
                              />
                            ) : null
                          })()}
                        </td>
                        <td className="py-2 pr-4 text-sm text-right tabular-nums max-w-[100px]">
                          {fee.usage_original
                            ? `${formatUsage(fee.usage_metric!, { usage: fee.usage_original })}`
                            : fee.quantity
                              ? fee.quantity
                              : null}
                        </td>
                        <td className="py-2 text-sm">
                          {fee.unit_price_desc
                            ? `${fee.unit_price_desc}`
                            : fee.unit_price
                              ? formatCurrency(fee.unit_price)
                              : null}
                        </td>
                        <td className="py-2 text-sm text-right max-w-[70px]">
                          {formatCurrency(fee.amount) ?? formatCurrency(0)}
                        </td>
                      </tr>
                    </Collapsible.Trigger>

                    <Collapsible.Content asChild>
                      <>
                        {fee.breakdown?.map((breakdown) => (
                          <tr
                            className="last:border-b cursor-pointer"
                            style={{ WebkitAppearance: 'initial' }}
                            key={breakdown.project_ref}
                          >
                            <td className="pb-1 text-xs pl-8 max-w-[200px]">
                              {breakdown.project_name}
                            </td>
                            <td className="pb-1 text-xs tabular-nums text-right pr-4">
                              {formatUsage(fee.usage_metric!, breakdown)}
                            </td>
                            <td />
                            <td />
                          </tr>
                        ))}
                      </>
                    </Collapsible.Content>
                  </tbody>
                </Collapsible>
              ))}

            {computeCredits && (
              <tbody>
                <tr className="border-b">
                  <td className="py-2 text-sm max-w-[200px]">
                    <span className="mr-2">{computeCredits.description}</span>
                    <InvoiceTooltip
                      text="Paid plans come with $10 in Compute Credits to cover one Micro instance or parts of any other instance. Compute Credits are given to you every month and do not stack up while you are on a paid plan."
                      linkRef="https://supabase.com/docs/guides/platform/org-based-billing#compute-credits"
                    />
                  </td>
                  <td className="py-2 text-sm text-right" colSpan={3}>
                    {formatCurrency(computeCredits.amount)}
                  </td>
                </tr>
              </tbody>
            )}

            <tfoot>
              <tr>
                <td className="py-4 text-sm font-medium">
                  <span className="mr-2">Current Costs</span>
                  <InvoiceTooltip text="Costs accumulated from the beginning of the billing cycle up to now." />
                </td>
                <td className="py-4 text-sm text-right font-medium" colSpan={3}>
                  {formatCurrency(upcomingInvoice?.amount_total) ?? '-'}
                </td>
              </tr>
              <tr>
                <td className="text-sm font-medium">
                  <span className="mr-2">Projected Costs</span>
                  <InvoiceTooltip text="Projected costs at the end of the billing cycle. Includes predictable costs for Compute Hours, IPv4, Custom Domain and Point-In-Time-Recovery, but no costs for metrics like MAU, storage or function invocations. Final amounts may vary depending on your usage." />
                </td>
                <td className="text-sm text-right font-medium" colSpan={3}>
                  {formatCurrency(upcomingInvoice?.amount_projected) ?? '-'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </>
  )
}

const InvoiceTooltip = ({ text, linkRef }: { text: string; linkRef?: string }) => {
  return (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger>
        <Info size={12} strokeWidth={2} />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="bottom">
          <Tooltip.Arrow className="radix-tooltip-arrow" />
          <div className="rounded bg-alternative py-1 px-2 leading-none shadow border border-background min-w-[300px] max-w-[450px] max-h-[300px] overflow-y-auto">
            <span className="text-xs text-foreground">
              <p>
                {text}{' '}
                {linkRef && (
                  <Link
                    href={linkRef}
                    target="_blank"
                    className="transition text-brand hover:text-brand-600 underline"
                  >
                    Read more
                  </Link>
                )}
              </p>
            </span>
          </div>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export default UpcomingInvoice
