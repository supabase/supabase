import Link from 'next/link'

import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { PricingMetric } from 'data/analytics/org-daily-stats-query'
import {
  UpcomingInvoiceResponse,
  useOrgUpcomingInvoiceQuery,
} from 'data/invoices/org-invoice-upcoming-query'
import { DOCS_URL } from 'lib/constants'
import { formatCurrency } from 'lib/helpers'
import React from 'react'
import { Table, TableBody, TableCell, TableFooter, TableRow } from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { billingMetricUnit, formatUsage } from '../helpers'

export interface UpcomingInvoiceProps {
  slug?: string
}

const usageBillingDocsLink: { [K in PricingMetric]?: string } = {
  [PricingMetric.MONTHLY_ACTIVE_USERS]: `${DOCS_URL}/guides/platform/manage-your-usage/monthly-active-users`,
  [PricingMetric.MONTHLY_ACTIVE_SSO_USERS]: `${DOCS_URL}/guides/platform/manage-your-usage/monthly-active-users-sso`,
  [PricingMetric.MONTHLY_ACTIVE_THIRD_PARTY_USERS]: `${DOCS_URL}/guides/platform/manage-your-usage/monthly-active-users-third-party`,
  [PricingMetric.AUTH_MFA_PHONE]: `${DOCS_URL}/guides/platform/manage-your-usage/advanced-mfa-phone`,

  [PricingMetric.EGRESS]: `${DOCS_URL}/guides/platform/manage-your-usage/egress`,
  [PricingMetric.CACHED_EGRESS]: `${DOCS_URL}/guides/platform/manage-your-usage/egress`,

  [PricingMetric.FUNCTION_INVOCATIONS]: `${DOCS_URL}/guides/platform/manage-your-usage/edge-function-invocations`,

  [PricingMetric.STORAGE_SIZE]: `${DOCS_URL}/guides/platform/manage-your-usage/storage-size`,
  [PricingMetric.STORAGE_IMAGES_TRANSFORMED]: `${DOCS_URL}/guides/platform/manage-your-usage/storage-image-transformations`,

  [PricingMetric.REALTIME_MESSAGE_COUNT]: `${DOCS_URL}/guides/platform/manage-your-usage/realtime-messages`,
  [PricingMetric.REALTIME_PEAK_CONNECTIONS]: `${DOCS_URL}/guides/platform/manage-your-usage/realtime-peak-connections`,

  [PricingMetric.CUSTOM_DOMAIN]: `${DOCS_URL}/guides/platform/manage-your-usage/custom-domains`,
  [PricingMetric.IPV4]: `${DOCS_URL}/guides/platform/manage-your-usage/ipv4`,
  [PricingMetric.PITR_7]: `${DOCS_URL}/guides/platform/manage-your-usage/point-in-time-recovery`,
  [PricingMetric.PITR_14]: `${DOCS_URL}/guides/platform/manage-your-usage/point-in-time-recovery`,
  [PricingMetric.PITR_28]: `${DOCS_URL}/guides/platform/manage-your-usage/point-in-time-recovery`,
  [PricingMetric.DISK_SIZE_GB_HOURS_GP3]: `${DOCS_URL}/guides/platform/manage-your-usage/disk-size`,
  [PricingMetric.DISK_SIZE_GB_HOURS_IO2]: `${DOCS_URL}/guides/platform/manage-your-usage/disk-size`,
  [PricingMetric.DISK_IOPS_GP3]: `${DOCS_URL}/guides/platform/manage-your-usage/disk-iops`,
  [PricingMetric.DISK_IOPS_IO2]: `${DOCS_URL}/guides/platform/manage-your-usage/disk-iops`,
  [PricingMetric.DISK_THROUGHPUT_GP3]: `${DOCS_URL}/guides/platform/manage-your-usage/disk-throughput`,
  [PricingMetric.LOG_DRAIN]: `${DOCS_URL}/guides/platform/manage-your-usage/log-drains`,
}

const UpcomingInvoice = ({ slug }: UpcomingInvoiceProps) => {
  const {
    data: upcomingInvoice,
    error: error,
    isLoading,
    isError,
    isSuccess,
  } = useOrgUpcomingInvoiceQuery({ orgSlug: slug })

  const computeItems =
    upcomingInvoice?.lines?.filter(
      (item) =>
        item.description?.toLowerCase().includes('compute') &&
        item.breakdown &&
        item.breakdown?.length > 0
    ) || []

  const computeCreditsItem =
    upcomingInvoice?.lines?.find((item) => item.description.startsWith('Compute Credits')) ?? null

  const planItem = upcomingInvoice?.lines?.find((item) =>
    item.description?.toLowerCase().includes('plan')
  )

  const regularComputeItems = computeItems.filter(
    (it) => !it.metadata?.is_branch && !it.metadata?.is_read_replica
  )
  const branchingComputeItems = computeItems.filter((it) => it.metadata?.is_branch)
  const replicaComputeItems = computeItems.filter((it) => it.metadata?.is_read_replica)

  const otherItems =
    upcomingInvoice?.lines?.filter(
      (item) =>
        !item.description?.toLowerCase().includes('compute') &&
        !item.description?.toLowerCase().includes('plan')
    ) || []

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
          <div>
            <Table className="w-full text-sm">
              <TableBody>
                <TableRow>
                  <TableCell className="!py-2 px-0">{planItem?.description}</TableCell>
                  <TableCell className="text-right py-2 px-0">
                    {planItem == null ? (
                      '-'
                    ) : (
                      <InvoiceLineItemAmount
                        amount={planItem.amount}
                        amountBeforeDiscount={planItem.amount_before_discount}
                      />
                    )}
                  </TableCell>
                </TableRow>

                {/* Compute section */}
                <ComputeLineItem
                  computeItems={regularComputeItems}
                  title="Compute"
                  computeCredits={computeCreditsItem}
                  tooltip={
                    <p className="prose text-xs">
                      The first project is covered by Compute Credits. Additional projects incur
                      compute costs starting at <span translate="no">$10</span>/month, independent
                      of activity. See{' '}
                      <Link
                        href={`${DOCS_URL}/guides/platform/manage-your-usage/compute`}
                        target="_blank"
                      >
                        docs
                      </Link>
                      .
                    </p>
                  }
                />

                {/* Read Replica compute */}
                <ComputeLineItem
                  title="Replica Compute"
                  computeItems={replicaComputeItems}
                  tooltip={
                    <p className="prose text-xs">
                      Each Read Replica is a dedicated database. You are charged for its resources:
                      Compute, Disk Size, provisioned Disk IOPS, provisioned Disk Throughput, and
                      IPv4. See{' '}
                      <Link
                        href={`${DOCS_URL}/guides/platform/manage-your-usage/read-replicas`}
                        target="_blank"
                      >
                        docs
                      </Link>
                      .
                    </p>
                  }
                />

                {/* Branching compute */}
                {branchingComputeItems.length > 0 && (
                  <TableRow>
                    <TableCell className="py-2 px-0">
                      <div className="flex items-center gap-1">
                        <span>Branching</span>
                        <InfoTooltip className="max-w-sm">
                          <ul className="ml-6 list-disc">
                            {branchingComputeItems
                              .flatMap((it) => it.breakdown)
                              .map((breakdown) => (
                                <li key={`branching-breakdown-${breakdown!.project_ref}`}>
                                  {breakdown!.project_name} ({breakdown!.usage} Hours)
                                </li>
                              ))}
                          </ul>

                          <p className="mt-2">
                            See{' '}
                            <Link
                              className="underline"
                              href={`${DOCS_URL}/guides/platform/manage-your-usage/branching`}
                              target="_blank"
                            >
                              docs
                            </Link>{' '}
                            on how billing for Branching works.
                          </p>
                        </InfoTooltip>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-2 px-0">
                      <InvoiceLineItemAmount
                        amount={branchingComputeItems.reduce((prev, cur) => prev + cur.amount, 0)}
                        amountBeforeDiscount={branchingComputeItems.reduce(
                          (prev, cur) => prev + (cur.amount_before_discount ?? 0),
                          0
                        )}
                      />
                    </TableCell>
                  </TableRow>
                )}

                {/* Non-compute items */}
                {otherItems.map((item) => (
                  <TableRow key={item.description}>
                    <TableCell className="py-2 px-0">
                      <div className="gap-1 flex items-center">
                        <span>{item.description ?? 'Unknown'}</span>
                        {((item.breakdown && item.breakdown.length > 0) ||
                          item.usage_metric != null) && (
                          <InfoTooltip className="max-w-sm">
                            {item.unit_price_desc && (
                              <p className="mb-2" translate="no">
                                Pricing: {item.unit_price_desc}
                              </p>
                            )}

                            {item.breakdown && item.breakdown.length > 0 && (
                              <>
                                <p>Projects using {item.description}:</p>
                                <ul className="ml-6 list-disc">
                                  {item.breakdown.map((breakdown) => (
                                    <li
                                      key={`${item.description}-breakdown-${breakdown.project_ref}`}
                                    >
                                      <Link
                                        className="underline"
                                        href={`/project/${breakdown.project_ref}`}
                                        target="_blank"
                                      >
                                        {breakdown.project_name}
                                      </Link>{' '}
                                      {item.usage_metric && (
                                        <span>
                                          ({formatUsage(item.usage_metric, breakdown)}{' '}
                                          {billingMetricUnit(item.usage_metric)})
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}

                            {item.usage_metric &&
                              usageBillingDocsLink[item.usage_metric] != null && (
                                <p className="mt-2">
                                  See{' '}
                                  <Link
                                    className="underline"
                                    href={usageBillingDocsLink[item.usage_metric]!}
                                    target="_blank"
                                  >
                                    docs
                                  </Link>{' '}
                                  on how billing for {item.description} works and{' '}
                                  <Link className="underline" href={`/organization/${slug}/usage`}>
                                    usage page
                                  </Link>{' '}
                                  for a detailed breakdown.
                                </p>
                              )}
                          </InfoTooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-2 px-0">
                      <InvoiceLineItemAmount
                        amount={item.amount}
                        amountBeforeDiscount={item.amount_before_discount}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              <TableFooter>
                <TableRow>
                  <TableCell className="font-medium py-2 px-0 flex items-center">
                    <span className="mr-2">Current Costs</span>
                    <InfoTooltip>
                      Costs accumulated from the beginning of the billing cycle up to now.
                    </InfoTooltip>
                  </TableCell>
                  <TableCell className="text-right font-medium py-2 px-0" translate="no">
                    {formatCurrency(upcomingInvoice?.amount_total) ?? '-'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium py-2 px-0 flex items-center">
                    <span className="mr-2">Projected Costs</span>
                    <InfoTooltip className="max-w-xs">
                      Projected costs at the end of the billing cycle. Includes predictable costs
                      for Compute Hours, IPv4, Custom Domain and Point-In-Time-Recovery, but no
                      costs for metrics like MAU, storage or function invocations. Final amounts may
                      vary depending on your usage.
                    </InfoTooltip>
                  </TableCell>
                  <TableCell className="text-right font-medium py-2 px-0" translate="no">
                    {formatCurrency(upcomingInvoice?.amount_projected) ?? '-'}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>
      )}
    </>
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
  } else {
    return <span translate="no">{formatCurrency(amount)}</span>
  }
}

function ComputeLineItem({
  computeItems,
  tooltip,
  title,
  computeCredits,
}: {
  title: string
  tooltip: React.ReactElement
  computeItems: UpcomingInvoiceResponse['lines']
  computeCredits?: UpcomingInvoiceResponse['lines'][number] | null
}) {
  const computeProjects = computeItems
    .flatMap((item) =>
      item.breakdown!.map((project) => ({
        ...project,
        computeType: item.description,
        computeCosts: project.amount!,
      }))
    )
    // descending by cost
    .sort((a, b) => b.computeCosts - a.computeCosts)

  const computeCosts = Math.max(
    0,
    computeItems.reduce((prev, cur) => prev + cur.amount_before_discount, 0)
  )

  const discountedComputeCosts = Math.max(
    0,
    computeItems.reduce((prev, cur) => prev + (cur.amount ?? 0), 0) + (computeCredits?.amount ?? 0)
  )

  if (!computeItems.length) return null

  return (
    <>
      <TableRow>
        <TableCell className="!py-2 px-0 flex items-center gap-1">
          <span>{title}</span>
          <InfoTooltip className="max-w-sm">{tooltip}</InfoTooltip>
        </TableCell>
        <TableCell className="text-right py-2 px-0">
          <InvoiceLineItemAmount
            amount={discountedComputeCosts}
            amountBeforeDiscount={computeCosts}
          />
        </TableCell>
      </TableRow>
      {computeProjects.map((project) => (
        <TableRow key={project.project_ref} className="text-foreground-light text-xs">
          <TableCell className="!py-2 px-0 pl-6">
            {project.project_name} ({project.computeType} - {project.usage} Hours)
          </TableCell>

          <TableCell className="!py-2 px-0 text-right" translate="no">
            {formatCurrency(project.computeCosts)}
          </TableCell>
        </TableRow>
      ))}

      {computeCredits && (
        <TableRow className="text-foreground-light text-xs">
          <TableCell className="!py-2 px-0 pl-6">Compute Credits</TableCell>
          <TableCell className="!py-2 px-0 text-right" translate="no">
            {formatCurrency(computeCredits.amount)}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export default UpcomingInvoice
