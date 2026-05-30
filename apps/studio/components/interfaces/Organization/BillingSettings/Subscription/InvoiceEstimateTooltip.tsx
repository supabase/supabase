import { HelpCircle } from 'lucide-react'
import Link from 'next/link'
import {
  cn,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import AlertError from '@/components/ui/AlertError'
import { type OrganizationBillingSubscriptionPreviewQueryResult } from '@/data/organizations/organization-billing-subscription-preview'
import { DOCS_URL } from '@/lib/constants'
import { formatCurrency } from '@/lib/helpers'

const CELL_CLASSNAME = 'py-2 px-0'

interface InvoiceEstimateTooltipProps {
  subscriptionPreviewQueryResult: OrganizationBillingSubscriptionPreviewQueryResult
}

export const InvoiceEstimateTooltip = ({
  subscriptionPreviewQueryResult,
}: InvoiceEstimateTooltipProps) => {
  const {
    data: subscriptionPreview,
    error: subscriptionPreviewError,
    isPending: subscriptionPreviewIsLoading,
    isSuccess: subscriptionPreviewInitialized,
  } = subscriptionPreviewQueryResult

  return (
    <HoverCard openDelay={50} closeDelay={50}>
      <HoverCardTrigger>
        <HelpCircle size={12} />
      </HoverCardTrigger>
      <HoverCardContent side="right" align="start" className="w-[400px] -translate-y-6">
        <h4 className="font-medium">Your new monthly invoice</h4>
        <p className="prose text-xs mb-2 text-balance">
          First project included. Additional projects cost <span translate="no">$10</span>+/month
          regardless of activity.{' '}
          <Link
            target="_blank"
            rel="noopener noreferrer"
            href={`${DOCS_URL}/guides/platform/manage-your-usage/compute`}
          >
            Learn more
          </Link>
          .
        </p>

        {subscriptionPreviewError && (
          <AlertError error={subscriptionPreviewError} subject="Failed to preview subscription." />
        )}

        {subscriptionPreviewIsLoading && (
          <div className="space-y-2">
            <span className="text-sm">Estimating monthly costs...</span>
            <GenericSkeletonLoader />
          </div>
        )}

        {subscriptionPreviewInitialized && (
          <div className="max-h-[400px] overflow-y-auto">
            <Table className="[&_tr:last-child]:border-t font-mono text-xs">
              <TableBody>
                {/* Non-compute items and Projects list */}
                {(() => {
                  // Combine all compute-related projects
                  const computeItems =
                    subscriptionPreview?.breakdown?.filter(
                      (item) =>
                        item.description?.toLowerCase().includes('compute') &&
                        item.breakdown &&
                        item.breakdown.length > 0
                    ) || []

                  const computeCreditsItem =
                    subscriptionPreview?.breakdown?.find((item) =>
                      item.description?.startsWith('Compute Credits')
                    ) ?? null

                  const planItem = subscriptionPreview?.breakdown?.find((item) =>
                    item.description?.toLowerCase().includes('plan')
                  )

                  const allProjects = computeItems.flatMap((item) =>
                    (item.breakdown || []).map((project) => ({
                      ...project,
                      computeType: item.description,
                      computeCosts: Math.round(item.total_price / item.breakdown!.length),
                    }))
                  )

                  const otherItems =
                    subscriptionPreview?.breakdown?.filter(
                      (item) =>
                        !item.description?.toLowerCase().includes('compute') &&
                        !item.description?.toLowerCase().includes('plan')
                    ) || []

                  const content = (
                    <>
                      {planItem && (
                        <TableRow className="text-foreground-light">
                          <TableCell className={CELL_CLASSNAME}>{planItem.description}</TableCell>
                          <TableCell
                            className={cn(CELL_CLASSNAME, 'text-foreground text-right')}
                            translate="no"
                          >
                            {formatCurrency(planItem.total_price)}
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Combined projects section */}
                      {allProjects.length > 0 && (
                        <>
                          <TableRow className="text-foreground-light">
                            <TableCell className={cn(CELL_CLASSNAME)}>
                              <span>Compute</span>
                            </TableCell>
                            <TableCell
                              translate="no"
                              className={cn(CELL_CLASSNAME, 'text-foreground text-right')}
                            >
                              {formatCurrency(
                                computeItems.reduce(
                                  (sum: number, item) => sum + item.total_price,
                                  0
                                ) + (computeCreditsItem?.total_price ?? 0)
                              )}
                            </TableCell>
                          </TableRow>

                          {allProjects.map((project) => (
                            <TableRow key={project.project_ref} className="text-foreground-lighter">
                              <TableCell translate="no" className={cn(CELL_CLASSNAME, 'pl-6')}>
                                <p
                                  title={`${project.project_name} (${project.computeType})`}
                                  className="truncate max-w-64"
                                >
                                  {project.project_name} ({project.computeType})
                                </p>
                              </TableCell>
                              <TableCell
                                translate="no"
                                className={cn(CELL_CLASSNAME, 'text-right')}
                              >
                                {formatCurrency(project.computeCosts)}
                              </TableCell>
                            </TableRow>
                          ))}

                          {computeCreditsItem && (
                            <TableRow className="text-foreground-lighter">
                              <TableCell translate="no" className={cn(CELL_CLASSNAME, 'pl-6')}>
                                Compute Credits
                              </TableCell>
                              <TableCell
                                translate="no"
                                className={cn(CELL_CLASSNAME, 'text-right')}
                              >
                                {formatCurrency(computeCreditsItem.total_price)}
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )}

                      {/* Non-compute items */}
                      {otherItems.map((item) => (
                        <TableRow key={item.description} className="text-foreground-light">
                          <TableCell className={cn(CELL_CLASSNAME, 'text-xs')}>
                            <div className="flex items-center gap-1">
                              <span>{item.description ?? 'Unknown'}</span>
                              {item.breakdown && item.breakdown.length > 0 && (
                                <InfoTooltip className="max-w-sm">
                                  <p>Projects using {item.description}:</p>
                                  <ul className="ml-6 list-disc">
                                    {item.breakdown.map((breakdown) => (
                                      <li
                                        key={`${item.description}-breakdown-${breakdown.project_ref}`}
                                      >
                                        {breakdown.project_name}
                                      </li>
                                    ))}
                                  </ul>
                                </InfoTooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell
                            translate="no"
                            className={cn(CELL_CLASSNAME, 'text-foreground text-right text-xs')}
                          >
                            {formatCurrency(item.total_price)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )
                  return content
                })()}

                <TableRow>
                  <TableCell className="font-medium py-2 px-0">
                    Total per month (excluding other usage)
                  </TableCell>
                  <TableCell className="text-right font-medium py-2 px-0" translate="no">
                    {formatCurrency(
                      subscriptionPreview?.breakdown?.reduce(
                        (prev, cur) => prev + cur.total_price,
                        0
                      ) ?? 0
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}
