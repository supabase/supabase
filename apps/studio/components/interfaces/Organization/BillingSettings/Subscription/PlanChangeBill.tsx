import { ClockIcon, PlusIcon, TriangleAlertIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import {
  formatRoundedCurrency,
  type AddonLine,
  type PlanChangeSummary,
} from './PlanChangeSummary.utils'
import type { OrgProject } from '@/data/projects/org-projects-infinite-query'
import { DOCS_URL } from '@/lib/constants'

const HOURS_IN_A_DAY = 24

const Amount = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn('tabular-nums', className)} translate="no">
    {children}
  </span>
)

const BillRow = ({
  label,
  description,
  amount,
  className,
}: {
  label: string
  description?: string
  amount: string | null
  className?: string
}) => (
  <div className={cn('flex items-start justify-between gap-4 px-5 py-4', className)}>
    <div>
      <p className="text-base text-foreground">{label}</p>
      {description && <p className="text-sm text-foreground-light">{description}</p>}
    </div>
    <Amount className="text-base text-foreground">{amount}</Amount>
  </div>
)

/**
 * One project's compute line. The plan's included compute credit pays for the first
 * project, which reads as a struck-through price plus a "Covered" badge.
 */
const ComputeProjectRow = ({
  name,
  amount,
  isCovered,
}: {
  name: string
  amount: number
  isCovered: boolean
}) => (
  <div className="flex items-center justify-between gap-4 py-1.5">
    <div className="flex min-w-0 items-center gap-2">
      <span className="size-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
      <span className="truncate text-base text-foreground" translate="no">
        {name}
      </span>
    </div>
    {isCovered ? (
      <div className="flex shrink-0 items-center gap-2">
        <Amount className="text-base text-foreground-lighter line-through">
          {formatRoundedCurrency(amount)}
        </Amount>
        <Badge variant="success">Covered</Badge>
      </div>
    ) : (
      <Amount className="shrink-0 text-base text-foreground">
        {formatRoundedCurrency(amount)}
      </Amount>
    )}
  </div>
)

const PausedProjectsRow = ({
  pausedProjects,
  perProjectMonthlyPrice,
}: {
  pausedProjects: OrgProject[]
  perProjectMonthlyPrice: number | null
}) => (
  <div className="py-1.5">
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-2">
        <span className="size-1.5 shrink-0 rounded-full bg-warning-500" aria-hidden="true" />
        <Tooltip>
          <TooltipTrigger className="truncate text-base text-foreground underline decoration-dotted underline-offset-4">
            {`${pausedProjects.length} paused ${pausedProjects.length === 1 ? 'project' : 'projects'}`}
          </TooltipTrigger>
          <TooltipContent side="top" align="start" className="w-80 p-3">
            <p className="mb-1 text-foreground">Paused projects</p>
            <ul className="my-2 list-disc pl-4 text-foreground-light">
              {pausedProjects.map((project) => (
                <li key={project.ref} translate="no">
                  {project.name}
                </li>
              ))}
            </ul>
            <p className="text-foreground-light">
              No compute charges while paused. Restoring a paused project adds{' '}
              <span translate="no">
                {`${perProjectMonthlyPrice === null ? '$10.00' : formatRoundedCurrency(perProjectMonthlyPrice)}/mo`}
              </span>{' '}
              while it runs.
            </p>

            <p className="text-foreground-light">
              Paused projects will remain paused until explicitly unpaused, you may{' '}
              <a
                href={`${DOCS_URL}/guides/platform/project-transfer`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                transfer it
              </a>{' '}
              to a Free Plan organization later.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Amount className="shrink-0 text-base text-foreground">{formatRoundedCurrency(0)}</Amount>
    </div>
    {perProjectMonthlyPrice !== null && (
      <p className="pl-3.5 text-sm text-foreground-lighter" translate="no">
        +{formatRoundedCurrency(perProjectMonthlyPrice)}/mo each if restored
      </p>
    )}
  </div>
)

/**
 * Compute bills by the hour at the same rate whether a project is busy or idle, which
 * is the part customers are most often surprised by. The 24 even segments say it
 * visually, as a quiet bar: there is no cheaper part of the day.
 */
const HourlyBillingPanel = () => (
  <div>
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-foreground-light">
      <p className="flex items-center gap-2">
        <ClockIcon size={14} className="shrink-0" aria-hidden="true" />
        Billed every hour, even when idle
      </p>
    </div>
    <div className="mt-2 flex gap-px" aria-hidden="true">
      {Array.from({ length: HOURS_IN_A_DAY }).map((_, hour) => (
        <span key={hour} className="h-1 flex-1 bg-foreground-muted/40" />
      ))}
    </div>
    <div className="mt-1 flex items-center justify-between text-xs leading-none text-foreground-lighter">
      <span translate="no">00:00</span>
      <span>busy or idle, same rate</span>
      <span translate="no">24:00</span>
    </div>
  </div>
)

/**
 * The monthly total. Tax is not a row of its own; it shows on hover so the total stays
 * the number the customer actually pays.
 */
const MonthlyTotal = ({ total, tax }: { total: number; tax: PlanChangeSummary['monthlyTax'] }) => {
  const amount = (
    <p className="shrink-0 text-xl text-foreground" translate="no">
      {formatRoundedCurrency(total)}
      <span className="ml-1 text-base text-foreground-light">/mo</span>
    </p>
  )
  if (!tax) return amount

  const rate = tax.ratePercentage === null ? '' : ` (${Number(tax.ratePercentage.toFixed(2))}%)`

  return (
    <Tooltip>
      <TooltipTrigger className="underline decoration-dotted underline-offset-4">
        {amount}
      </TooltipTrigger>
      <TooltipContent side="top" align="end" className="p-3">
        <p className="text-foreground-light" translate="no">
          Includes {formatRoundedCurrency(tax.amount)}
          {rate} in tax
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * A paid add-on or usage line carried over to the new plan. Always condensed to one row:
 * which projects it covers matters far less here than the fact that it is still billed.
 */
const AddonRow = ({ description, amount, projectCount, unitPriceDesc }: AddonLine) => (
  <BillRow
    label={
      projectCount > 0
        ? `${description} · ${projectCount} ${projectCount === 1 ? 'project' : 'projects'}`
        : description
    }
    description={unitPriceDesc}
    amount={formatRoundedCurrency(amount)}
  />
)

interface PlanChangeBillProps {
  planName: string
  summary: PlanChangeSummary
  pausedProjects: OrgProject[]
  /** Name and price of the plan being replaced, for an org that already pays for one. */
  currentPlan?: { name: string; price: number }
  /**
   * Organizations already on a paid plan know how compute bills and may run hundreds of
   * projects, so compute collapses to a single unchanged line instead of a project list.
   */
  isCondensed: boolean
}

export const PlanChangeBill = ({
  planName,
  summary,
  pausedProjects,
  currentPlan,
  isCondensed,
}: PlanChangeBillProps) => {
  const {
    computeProjects,
    computeTotal,
    perProjectMonthlyPrice,
    perProjectHourlyRate,
    projectCount,
  } = summary
  const hasActiveProjects = computeProjects.length > 0
  const canShowHourlyPanel = !isCondensed && hasActiveProjects && perProjectHourlyRate !== null

  return (
    <div className="divide-y rounded-md border bg-surface-200">
      <BillRow
        label={`${planName} Plan`}
        description={
          currentPlan
            ? `Replaces your ${formatRoundedCurrency(currentPlan.price)} ${currentPlan.name} Plan`
            : undefined
        }
        amount={formatRoundedCurrency(summary.planAmount)}
      />

      {isCondensed ? (
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-base text-foreground">
              {`Compute · ${projectCount} ${projectCount === 1 ? 'project' : 'projects'}`}
            </p>
            <p className="text-sm text-foreground-light">
              Same hourly rates as today, based on your current usage
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge>No change</Badge>
            <Amount className="text-base text-foreground">
              {formatRoundedCurrency(computeTotal)}
            </Amount>
          </div>
        </div>
      ) : (
        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base text-foreground">Compute</p>
            </div>
            <Amount className="text-base text-foreground">
              {computeTotal > 0
                ? `+${formatRoundedCurrency(computeTotal)}`
                : formatRoundedCurrency(computeTotal)}
            </Amount>
          </div>

          {canShowHourlyPanel && (
            <div className="mt-3">
              <HourlyBillingPanel />
            </div>
          )}

          <div className="mt-3">
            {!hasActiveProjects && (
              <div
                role="status"
                className="mb-2 flex items-start gap-2 rounded-md border border-warning-500 bg-warning-200 px-3 py-2 text-sm text-warning-600"
              >
                <TriangleAlertIcon size={14} className="mt-px shrink-0" aria-hidden="true" />
                <span>
                  This organization has no active projects. Did you select the correct organization?
                </span>
              </div>
            )}

            {computeProjects.map((project) => (
              <ComputeProjectRow key={project.ref} {...project} />
            ))}

            {pausedProjects.length > 0 && (
              <PausedProjectsRow
                pausedProjects={pausedProjects}
                perProjectMonthlyPrice={perProjectMonthlyPrice}
              />
            )}
          </div>

          {perProjectMonthlyPrice !== null && (
            <div className="mt-3 flex items-center justify-between gap-4 rounded-md border bg-surface-100 px-3 py-2">
              <div className="flex items-center gap-2 text-base text-foreground-light">
                <PlusIcon size={14} aria-hidden="true" />
                <span>Each new or restored project</span>
              </div>
              <Amount className="text-base text-foreground-light">
                +{formatRoundedCurrency(perProjectMonthlyPrice)}/mo
              </Amount>
            </div>
          )}
        </div>
      )}

      {summary.addons.map((addon) => (
        <AddonRow key={addon.description} {...addon} />
      ))}

      <div className="px-5 py-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-base text-foreground">Estimated monthly total</p>
            <p className="text-sm text-foreground-light">Plus usage beyond plan quotas</p>
          </div>
          <MonthlyTotal total={summary.monthlyTotal} tax={summary.monthlyTax} />
        </div>
      </div>
    </div>
  )
}
