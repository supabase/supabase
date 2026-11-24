import { ChevronDownIcon, ClockIcon, PlusIcon, TriangleAlertIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import {
  Badge,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import {
  formatHourlyRate,
  formatRoundedCurrency,
  type AddonLine,
  type PlanChangeSummary,
} from './PlanChangeSummary.utils'
import type { OrgProject } from '@/data/projects/org-projects-infinite-query'
import { DOCS_URL } from '@/lib/constants'
import { formatCurrency } from '@/lib/helpers'

/**
 * An illustrative day of traffic: idle overnight, busy in the afternoon. Each entry is
 * one hour's activity level, drawn inside a uniform billed track so the shape says what
 * the label says — the server is billed the same whether that hour is busy or idle.
 */
const HOURLY_ACTIVITY = [0, 0, 0, 0, 0, 1, 2, 3, 3, 4, 2, 4, 4, 3, 0, 3, 4, 2, 1, 0, 0, 1, 0, 0]

/** Illustrative hourly compute rate used by the chart and its copy. */
const ILLUSTRATIVE_HOURLY_RATE = 0.0137

/** How long one hour of the illustrative day takes to play while the section is open. */
const HOUR_TICK_MS = 400

/** Ticks the finished day holds on screen before the loop starts over. */
const HOLD_TICKS = 8

const ACTIVITY_HEIGHT: Record<number, string> = {
  1: 'h-1.5',
  2: 'h-3',
  3: 'h-5',
  4: 'h-7',
}

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
  badge,
}: {
  label: string
  description?: string
  amount: string | null
  className?: string
  badge?: ReactNode
}) => (
  <div className={cn('flex items-start justify-between gap-4 px-5 py-4', className)}>
    <div>
      <p className="text-base text-foreground">{label}</p>
      {description && <p className="text-sm text-foreground-light">{description}</p>}
    </div>
    <div className="flex shrink-0 items-center gap-2">
      {badge}
      <Amount className="text-base text-foreground">{amount}</Amount>
    </div>
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
  onProjectTransferDocsClick,
}: {
  pausedProjects: OrgProject[]
  perProjectMonthlyPrice: number | null
  onProjectTransferDocsClick: () => void
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
              No compute charges while paused. Resuming a paused project adds{' '}
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
                onClick={onProjectTransferDocsClick}
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
    <p className="pl-3.5 text-sm text-foreground-lighter" translate="no">
      {perProjectMonthlyPrice !== null
        ? `+${formatRoundedCurrency(perProjectMonthlyPrice)}/mo each if resumed`
        : 'First project included, then +$10.00/mo each if resumed'}
    </p>
  </div>
)

/**
 * Compute bills by the hour at the same rate whether a project is busy or idle, which
 * is the part customers are most often surprised by. An illustrative day says it
 * visually: the idle hours are drawn as empty outlines that still occupy an hour slot.
 */
const HourlyBillingPanel = ({
  perProjectMonthlyPrice,
  onOpen,
  onComputeDocsClick,
}: {
  perProjectMonthlyPrice: number | null
  onOpen: () => void
  onComputeDocsClick: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [tick, setTick] = useState(0)

  // While the section is open the chart loops through the day, hour by hour.
  useEffect(() => {
    if (!isOpen) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTick(HOURLY_ACTIVITY.length)
      return
    }

    setTick(0)
    const interval = setInterval(
      () => setTick((current) => (current + 1) % (HOURLY_ACTIVITY.length + HOLD_TICKS)),
      HOUR_TICK_MS
    )
    return () => clearInterval(interval)
  }, [isOpen])

  // The extra hold ticks at the end of a loop keep the finished day on screen for a beat.
  const elapsedHours = Math.min(tick, HOURLY_ACTIVITY.length)
  const readoutHour = Math.max(elapsedHours - 1, 0)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) onOpen()
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={handleOpenChange}
      className="overflow-hidden rounded-md border bg-field"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground-light">
        <ClockIcon size={14} className="shrink-0" aria-hidden="true" />
        <span>Billed every hour, even when idle</span>
        <ChevronDownIcon
          size={14}
          className={cn('ml-auto shrink-0 transition-transform', isOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="px-3 pb-3">
        <p className="text-sm text-foreground-light">
          Each project is a dedicated server. It bills{' '}
          <span translate="no">{formatHourlyRate(ILLUSTRATIVE_HOURLY_RATE)}</span> for every hour it
          is provisioned, busy or idle
          {perProjectMonthlyPrice !== null && (
            <span>
              , which adds up to about{' '}
              <span translate="no">{formatRoundedCurrency(perProjectMonthlyPrice)}/mo</span>
            </span>
          )}
          <span>.</span>{' '}
          <a
            href={`${DOCS_URL}/guides/platform/manage-your-usage/compute`}
            target="_blank"
            rel="noreferrer"
            className="underline"
            onClick={onComputeDocsClick}
          >
            Learn about compute
          </a>
        </p>

        <div className="mt-3 flex h-10 items-end gap-1" aria-hidden="true">
          {HOURLY_ACTIVITY.map((activity, hour) => {
            const isCurrentHour = hour === readoutHour

            return activity === 0 ? (
              <span
                key={hour}
                className={cn(
                  'h-full flex-1 rounded-xs border transition-colors duration-150',
                  isCurrentHour
                    ? 'border-solid border-foreground-light bg-foreground-muted/30'
                    : 'border-dashed border-foreground-muted'
                )}
              />
            ) : (
              <span
                key={hour}
                className={cn(
                  'flex-1 rounded-xs transition-colors duration-150',
                  ACTIVITY_HEIGHT[activity],
                  isCurrentHour ? 'bg-foreground' : 'bg-foreground-muted/60'
                )}
              />
            )
          })}
        </div>

        <p
          className="mt-1.5 text-right text-xs text-foreground-lighter tabular-nums"
          translate="no"
        >
          {`${String(readoutHour).padStart(2, '0')}:00 · ${formatHourlyRate(ILLUSTRATIVE_HOURLY_RATE * elapsedHours)} billed`}
        </p>
      </CollapsibleContent>
    </Collapsible>
  )
}

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
          Includes {formatCurrency(tax.amount)}
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
const AddonRow = ({
  description,
  amount,
  projectCount,
  unitPriceDesc,
  isUnchanged,
}: AddonLine & { isUnchanged: boolean }) => (
  <BillRow
    badge={isUnchanged ? <Badge>No change</Badge> : undefined}
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
  onHourlyBillingOpen: () => void
  onDocsLinkClick: (docsLink: 'compute' | 'project_transfer') => void
}

export const PlanChangeBill = ({
  planName,
  summary,
  pausedProjects,
  currentPlan,
  isCondensed,
  onHourlyBillingOpen,
  onDocsLinkClick,
}: PlanChangeBillProps) => {
  const { computeProjects, computeTotal, perProjectMonthlyPrice, projectCount } = summary
  const hasActiveProjects = computeProjects.length > 0
  const canShowHourlyPanel = !isCondensed

  return (
    <div className="divide-y rounded-md border bg-surface-200">
      <BillRow
        label={`${planName} Plan`}
        description={
          currentPlan
            ? `Replaces your ${formatCurrency(currentPlan.price)} ${currentPlan.name} Plan`
            : undefined
        }
        amount={formatCurrency(summary.planAmount)}
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
              <HourlyBillingPanel
                perProjectMonthlyPrice={perProjectMonthlyPrice}
                onOpen={onHourlyBillingOpen}
                onComputeDocsClick={() => onDocsLinkClick('compute')}
              />
            </div>
          )}

          <div className="mt-3">
            {/* The region stays mounted so screen readers announce the warning when it appears. */}
            <div role="status">
              {!hasActiveProjects && (
                <div className="mb-2 flex items-start gap-2 rounded-md border border-warning-500 bg-warning-200 px-3 py-2 text-sm text-warning-600">
                  <TriangleAlertIcon size={14} className="mt-px shrink-0" aria-hidden="true" />
                  <span>
                    This organization has no active projects. Did you select the correct
                    organization?
                  </span>
                </div>
              )}
            </div>

            {computeProjects.map((project) => (
              <ComputeProjectRow key={project.ref} {...project} />
            ))}

            {pausedProjects.length > 0 && (
              <PausedProjectsRow
                onProjectTransferDocsClick={() => onDocsLinkClick('project_transfer')}
                pausedProjects={pausedProjects}
                perProjectMonthlyPrice={perProjectMonthlyPrice}
              />
            )}
          </div>

          {perProjectMonthlyPrice !== null && (
            <div className="mt-3 flex items-center justify-between gap-4 border-t border-dashed pt-3">
              <div className="flex items-center gap-2 text-sm text-foreground-lighter">
                <PlusIcon size={14} aria-hidden="true" />
                <span>$10.00/mo for each new project</span>
              </div>
            </div>
          )}
        </div>
      )}

      {summary.addons.map((addon) => (
        <AddonRow key={addon.description} {...addon} isUnchanged={isCondensed} />
      ))}

      <div className="px-5 py-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-base text-foreground">Estimated monthly total</p>
            <p className="text-xs text-foreground-lighter">Plus usage beyond plan quotas</p>
          </div>
          <MonthlyTotal total={summary.monthlyTotal} tax={summary.monthlyTax} />
        </div>
      </div>
    </div>
  )
}
