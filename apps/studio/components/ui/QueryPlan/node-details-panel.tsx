import type { Node } from 'reactflow'
import { Fragment, type ReactNode } from 'react'
import {
  AlertTriangle,
  CircleDollarSign,
  Clock,
  Columns3,
  Filter,
  HardDrive,
  Info,
  ListFilter,
  Rows3,
  SquareChartGantt,
  Table,
  TimerReset,
  TrendingUp,
  X,
} from 'lucide-react'

import type { PlanMeta, PlanNodeData } from './types'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Badge,
  Button,
  Separator,
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { formatMs, formatNumber, formatOrDash } from './utils/formats'
import {
  COST_HELP_LINKS,
  SLOW_HELP_LINKS,
  hasLocal,
  hasShared,
  hasTemp,
  removedPercentValue,
  renderHelpLinks,
} from './utils/node-display'

const ESTIMATE_HELP_LINKS = [
  {
    label: 'Query troubleshooting guide',
    href: 'https://supabase.com/docs/guides/troubleshooting/understanding-postgresql-explain-output-Un9dqX',
  },
  {
    label: 'Tune planner estimates',
    href: 'https://www.postgresql.org/docs/current/routine-vacuuming.html',
  },
  {
    label: 'Manage indexes effectively',
    href: 'https://supabase.com/docs/guides/database/postgres/indexes',
  },
]

type NodeDetailsPanelProps = {
  node: Node<PlanNodeData>
  meta?: PlanMeta
  onClearSelection: () => void
  variant?: 'sidebar' | 'overlay'
}

type KeyValue = {
  key: string
  label: string
  value?: string | number
  hint?: string
}

type ConditionRow = {
  key: string
  label: string
  value?: string
}

const Section = ({
  title,
  description,
  children,
  icon,
  tooltip,
}: {
  title: string
  description?: string
  children: ReactNode
  icon?: ReactNode
  tooltip?: ReactNode
}) => {
  return (
    <section className="flex flex-col gap-2 px-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon ?? null}
          <div className="flex items-start">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    aria-label={`About ${title}`}
                    className="flex w-5 items-center justify-center rounded border border-transparent text-foreground-lighter transition-colors hover:text-foreground"
                  >
                    <Info size={10} />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] text-[11px] leading-relaxed">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        {description && <span className="text-[11px] text-foreground-light">{description}</span>}
      </div>
      <div className="space-y-2 text-xs text-foreground">{children}</div>
    </section>
  )
}

const formatPercent = (value?: number) => {
  if (value === undefined || Number.isNaN(value)) return undefined
  return `${value.toFixed(1)}%`
}

const bufferTotal = (hit?: number, read?: number, dirtied?: number, written?: number) =>
  (hit ?? 0) + (read ?? 0) + (dirtied ?? 0) + (written ?? 0)

const exclusiveBufferTotal = (data: PlanNodeData) => {
  const shared = bufferTotal(
    data.exSharedHit,
    data.exSharedRead,
    data.exSharedDirtied,
    data.exSharedWritten
  )
  const temp = (data.exTempRead ?? 0) + (data.exTempWritten ?? 0)
  const local = bufferTotal(
    data.exLocalHit,
    data.exLocalRead,
    data.exLocalDirtied,
    data.exLocalWritten
  )

  return { shared, temp, local, total: shared + temp + local }
}

const inclusiveBufferTotal = (data: PlanNodeData) => {
  const shared = bufferTotal(
    data.sharedHit,
    data.sharedRead,
    data.sharedDirtied,
    data.sharedWritten
  )
  const temp = (data.tempRead ?? 0) + (data.tempWritten ?? 0)
  const local = bufferTotal(data.localHit, data.localRead, data.localDirtied, data.localWritten)

  return { shared, temp, local, total: shared + temp + local }
}

const ESTIMATION_THRESHOLD_MAJOR = 10
const ESTIMATION_THRESHOLD_CRITICAL = 100

type EstimationInsight = {
  badgeText: string
  summary: string
  implication: string
  guidance: string
  severity: 'major' | 'critical'
  variant: 'warning' | 'destructive'
}

const formatEstimateMultiplier = (value: number): string => {
  if (!Number.isFinite(value)) return '∞'
  if (value >= 100) {
    const rounded = Math.round(value)
    return formatNumber(rounded) ?? `${rounded}`
  }
  const formatted = value.toFixed(1)
  return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted
}

const computeEstimationInsight = (data: PlanNodeData): EstimationInsight | undefined => {
  if (data.estFactor === undefined || data.estFactor <= 0) return undefined
  if (!data.estDirection || data.estDirection === 'none') return undefined

  const normalizedFactor =
    data.estDirection === 'over'
      ? data.estFactor === 0
        ? Number.POSITIVE_INFINITY
        : 1 / data.estFactor
      : data.estFactor

  if (!Number.isFinite(normalizedFactor) && normalizedFactor !== Number.POSITIVE_INFINITY)
    return undefined

  if (normalizedFactor < ESTIMATION_THRESHOLD_MAJOR) return undefined

  const severity = normalizedFactor >= ESTIMATION_THRESHOLD_CRITICAL ? 'critical' : 'major'
  const variant = severity === 'critical' ? 'destructive' : 'warning'
  const directionTitle = data.estDirection === 'over' ? 'Over' : 'Under'
  const directionLower = directionTitle.toLowerCase()
  const multiplierText = formatEstimateMultiplier(normalizedFactor)

  const loops = data.actualLoops ?? 1
  const actualPerLoop = data.actualRows !== undefined ? formatNumber(data.actualRows) : undefined
  const plannedPerLoop = data.planRows !== undefined ? formatNumber(data.planRows) : undefined
  const actualTotal =
    data.estActualTotalRows !== undefined
      ? formatNumber(data.estActualTotalRows)
      : actualPerLoop && loops > 1
        ? formatNumber((data.actualRows ?? 0) * loops)
        : undefined
  const plannedTotal =
    plannedPerLoop && loops > 1 ? formatNumber((data.planRows ?? 0) * loops) : undefined

  const summaryParts: string[] = []
  summaryParts.push(
    `Planner ${directionLower}estimated rows ${
      Number.isFinite(normalizedFactor) ? `by ~${multiplierText}×` : 'by an extremely large margin'
    }.`
  )

  if (actualPerLoop && plannedPerLoop) {
    summaryParts.push(`Observed ${actualPerLoop} vs ${plannedPerLoop} planned per loop.`)
    if (loops > 1 && actualTotal && plannedTotal) {
      summaryParts.push(
        `Across ${formatNumber(loops)} loops (~${actualTotal} rows vs ${plannedTotal} planned).`
      )
    }
  }

  const implication =
    data.estDirection === 'under'
      ? 'This gap usually means the planner picked a strategy optimized for far fewer rows, which can lead to expensive nested loops or repeat scans.'
      : 'This gap usually means the planner avoided selective indexes and chose broader scans because it expected many more rows.'
  const guidance =
    'Make sure table statistics are current (autovacuum or a manual ANALYZE if you have access) and review indexes or predicates so the planner has more reliable estimates.'

  return {
    badgeText: `${directionTitle}estimated ×${multiplierText}`,
    summary: summaryParts.join(' '),
    implication,
    guidance,
    severity,
    variant,
  }
}

export const NodeDetailsPanel = ({
  node,
  meta,
  onClearSelection,
  variant = 'sidebar',
}: NodeDetailsPanelProps) => {
  const data = node.data

  const loops = data.actualLoops ?? 1
  const formattedLoops = formatNumber(loops) ?? `${loops}`
  const totalTimePerLoop = data.actualTotalTime
  const totalTimeAllLoops = loops > 1 && totalTimePerLoop ? totalTimePerLoop * loops : undefined
  const formattedTotalTimePerLoop = formatMs(totalTimePerLoop)
  const formattedTotalTimeAllLoops = totalTimeAllLoops ? formatMs(totalTimeAllLoops) : undefined
  const formattedSelfTime = formatMs(data.exclusiveTimeMs)
  const executionShare =
    data.exclusiveTimeMs !== undefined && meta?.executionTime
      ? formatPercent((data.exclusiveTimeMs / meta.executionTime) * 100)
      : undefined
  const actualRows = data.actualRows !== undefined ? formatNumber(data.actualRows) : undefined
  const rowsAcrossLoops =
    data.actualRows !== undefined
      ? formatNumber((data.actualRows ?? 0) * Math.max(loops, 1))
      : undefined
  const plannedRowsPerLoop = data.planRows !== undefined ? formatNumber(data.planRows) : undefined
  const plannedRowsAcrossLoops =
    data.planRows !== undefined
      ? formatNumber((data.planRows ?? 0) * Math.max(loops, 1))
      : undefined
  const estFactor =
    data.estFactor !== undefined
      ? `${data.estFactor.toFixed(data.estFactor >= 10 ? 0 : 2)}×`
      : undefined
  const estimationDirectionLabel =
    data.estDirection && data.estDirection !== 'none'
      ? data.estDirection === 'under'
        ? 'Planner underestimated'
        : 'Planner overestimated'
      : undefined

  const filteredPercent = removedPercentValue(data, data.rowsRemovedByFilter)
  const joinFilteredPercent = removedPercentValue(data, data.rowsRemovedByJoinFilter)
  const recheckPercent = removedPercentValue(data, data.rowsRemovedByIndexRecheck)

  const exclusiveBuffers = exclusiveBufferTotal(data)
  const inclusiveBuffers = inclusiveBufferTotal(data)

  const hasSharedBuffers = data ? hasShared(data) : false
  const hasTempBuffers = hasTemp(data)
  const hasLocalBuffers = hasLocal(data)
  const hasBufferData = hasSharedBuffers || hasTempBuffers || hasLocalBuffers
  const hasIOTiming = (data.ioReadTime ?? 0) + (data.ioWriteTime ?? 0) > 0
  const estimationInsight = computeEstimationInsight(data)

  const plannerEstimates: KeyValue[] = [
    { key: 'startup', label: 'Startup cost', value: data.startupCost?.toFixed(2) },
    { key: 'total', label: 'Total cost', value: data.totalCost?.toFixed(2) },
    {
      key: 'planRows',
      label: 'Estimated rows',
      value: data.planRows ? formatNumber(data.planRows) : undefined,
    },
    {
      key: 'planWidth',
      label: 'Row width',
      value: data.planWidth ? `${data.planWidth} B` : undefined,
    },
  ]

  const conditionRows: ConditionRow[] = [
    { key: 'filter', label: 'Filter', value: data.filter },
    { key: 'hash-cond', label: 'Hash condition', value: data.hashCond },
    { key: 'index-cond', label: 'Index recheck', value: data.recheckCond },
    { key: 'join-filter', label: 'Join filter', value: data.joinFilter },
    { key: 'merge-cond', label: 'Merge condition', value: data.mergeCond },
    { key: 'index', label: 'Index condition', value: data.indexCond },
  ]

  const outputColumns = data.outputCols ?? []

  const slowHint = data.slowHint
  const costHint = data.costHint
  const slowHintShare = slowHint ? Math.round(slowHint.selfTimeShare * 100) : undefined
  const slowHintTimeText = slowHint
    ? `${formatMs(slowHint.selfTimeMs) ?? slowHint.selfTimeMs.toFixed(2)} ms`
    : undefined
  const costHighlightValue = data.totalCost ?? costHint?.selfCost
  const formattedCostHighlight =
    costHighlightValue !== undefined ? costHighlightValue.toFixed(2) : undefined
  const costHintExclusiveShare =
    costHint?.selfCostShare !== undefined
      ? Math.round((costHint.selfCostShare ?? 0) * 100)
      : undefined
  const costHintMaxTotalShare =
    costHint?.maxTotalCostShare !== undefined
      ? Math.round((costHint.maxTotalCostShare ?? 0) * 100)
      : undefined
  const costShareDetails: string[] = []
  if (costHintExclusiveShare !== undefined) {
    costShareDetails.push(`~${costHintExclusiveShare}% of exclusive plan cost`)
  }
  if (costHintMaxTotalShare !== undefined) {
    costShareDetails.push(`~${costHintMaxTotalShare}% of the plan's highest total cost`)
  }
  const costHintSummary =
    costHintMaxTotalShare !== undefined && costHintMaxTotalShare >= (costHintExclusiveShare ?? -1)
      ? ` (~${costHintMaxTotalShare}% of the plan's highest total cost).`
      : costHintExclusiveShare !== undefined
        ? ` (~${costHintExclusiveShare}% of exclusive plan cost).`
        : '.'

  const hasTimeDetails = Boolean(
    data.actualTotalTime !== undefined ||
      data.exclusiveTimeMs !== undefined ||
      slowHint ||
      data.actualLoops !== undefined
  )
  const hasCostDetails = Boolean(
    data.startupCost !== undefined ||
      data.totalCost !== undefined ||
      data.exclusiveCost !== undefined ||
      costHint
  )
  const hasEstimateDetails = Boolean(
    data.estFactor !== undefined ||
      (data.estDirection && data.estDirection !== 'none') ||
      data.planRows !== undefined ||
      data.actualRows !== undefined
  )

  return (
    <aside
      className={cn(
        'flex h-full flex-col bg-sidebar shadow-lg',
        variant === 'overlay' ? 'w-full max-w-none rounded-md' : 'w-[380px] border-l border-border'
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2 h-[41px]">
        <div className="flex items-center gap-2">
          <span className="truncate text-xs font-semibold text-foreground">{data.label}</span>
        </div>
        <Button
          type="default"
          size="tiny"
          icon={<X size={12} className="group-hover:text-foreground transition-colors" />}
          className="shrink-0 h-7 w-7 border-none bg-transparent dark:bg-transparent group"
          onClick={onClearSelection}
          aria-label="Clear selection"
        />
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <div className="flex flex-col gap-y-5">
          <Section
            title="Overview"
            description={data.neverExecuted ? 'This step never executed' : undefined}
            icon={<SquareChartGantt className="h-4 w-4" />}
            tooltip="Execution time, loop counts, and planner accuracy for this node."
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col rounded border border-border bg-surface-100 px-2 py-2">
                <span className="text-[11px] text-foreground-light">Total time (per loop)</span>
                <span className="text-sm font-medium">
                  {formattedTotalTimePerLoop ? `${formattedTotalTimePerLoop} ms` : '—'}
                </span>
                {formattedTotalTimeAllLoops ? (
                  <span className="text-[11px] text-foreground-light">
                    All loops combined {formattedTotalTimeAllLoops} ms
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col rounded border border-border bg-surface-100 px-2 py-2">
                <span className="text-[11px] text-foreground-light">Self time</span>
                <span className="text-sm font-medium">
                  {formattedSelfTime ? `${formattedSelfTime} ms` : '—'}
                </span>
                {executionShare ? (
                  <span className="text-[11px] text-foreground-light">
                    {executionShare} of total execution
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col rounded border border-border bg-surface-100 px-2 py-2">
                <span className="text-[11px] text-foreground-light">Loops</span>
                <span className="text-sm font-medium">{formattedLoops}</span>
                {rowsAcrossLoops ? (
                  <span className="text-[11px] text-foreground-light">
                    Rows across loops {rowsAcrossLoops}
                  </span>
                ) : null}
              </div>
            </div>
          </Section>

          {hasTimeDetails && (
            <>
              <Separator />
              <Section
                title="Execution time"
                icon={<Clock className="h-4 w-4" />}
                tooltip="Detailed runtime stats for this node, including self time and loop counts."
              >
                <div className="space-y-3">
                  <dl className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-light">Total time (per loop)</dt>
                      <dd className="text-foreground font-medium">
                        {formattedTotalTimePerLoop ? `${formattedTotalTimePerLoop} ms` : '—'}
                      </dd>
                    </div>
                    {formattedTotalTimeAllLoops ? (
                      <div className="flex items-center justify-between">
                        <dt className="text-foreground-light">All loops combined</dt>
                        <dd className="text-foreground font-medium">
                          {formattedTotalTimeAllLoops} ms
                        </dd>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-light">Self time</dt>
                      <dd className="text-foreground font-medium">
                        {formattedSelfTime ? `${formattedSelfTime} ms` : '—'}
                        {executionShare ? (
                          <span className="ml-1 text-foreground-light">({executionShare})</span>
                        ) : null}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-light">Loops observed</dt>
                      <dd className="text-foreground font-medium">{formattedLoops}</dd>
                    </div>
                    {rowsAcrossLoops ? (
                      <div className="flex items-center justify-between">
                        <dt className="text-foreground-light">Rows across loops</dt>
                        <dd className="text-foreground font-medium">{rowsAcrossLoops}</dd>
                      </div>
                    ) : null}
                  </dl>
                  {slowHint ? (
                    <Alert_Shadcn_
                      variant={slowHint.severity === 'alert' ? 'destructive' : 'warning'}
                    >
                      <Clock size={16} />
                      <div>
                        <AlertTitle_Shadcn_ className="text-xs font-semibold text-foreground">
                          Slow node
                        </AlertTitle_Shadcn_>
                        <AlertDescription_Shadcn_ className="mt-1 text-[11px] leading-relaxed !text-foreground">
                          Self time {slowHintTimeText ?? '—'} ({slowHintShare ?? '—'}% of total
                          execution time).
                        </AlertDescription_Shadcn_>
                        <AlertDescription_Shadcn_ className="mt-1 text-[11px] text-foreground-light">
                          Consider narrowing the rows earlier in the plan or adding an index to
                          reduce work.
                        </AlertDescription_Shadcn_>
                        <div className="mt-2 text-[11px] leading-relaxed">
                          {renderHelpLinks(SLOW_HELP_LINKS)}
                        </div>
                      </div>
                    </Alert_Shadcn_>
                  ) : null}
                </div>
              </Section>
            </>
          )}

          {hasCostDetails && (
            <>
              <Separator />
              <Section
                title="Planner cost"
                icon={<CircleDollarSign className="h-4 w-4" />}
                tooltip="Planner-assigned cost units and any heuristics that flag this node."
              >
                <div className="space-y-3">
                  <dl className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-light">Startup cost</dt>
                      <dd className="text-foreground font-medium">
                        {data.startupCost !== undefined ? data.startupCost.toFixed(2) : '—'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-light">Total cost</dt>
                      <dd className="text-foreground font-medium">
                        {data.totalCost !== undefined ? data.totalCost.toFixed(2) : '—'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-light">Self cost</dt>
                      <dd className="text-foreground font-medium">
                        {data.exclusiveCost !== undefined ? data.exclusiveCost.toFixed(2) : '—'}
                        {costShareDetails.length > 0 ? (
                          <span className="ml-1 text-foreground-light">
                            ({costShareDetails.join('; ')})
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  </dl>
                  {costHint ? (
                    <Alert_Shadcn_
                      variant={costHint.severity === 'alert' ? 'destructive' : 'warning'}
                    >
                      <AlertTriangle size={16} />
                      <div>
                        <AlertTitle_Shadcn_ className="text-xs font-semibold text-foreground">
                          Cost is high
                        </AlertTitle_Shadcn_>
                        <AlertDescription_Shadcn_ className="mt-1 text-[11px] leading-relaxed !text-foreground">
                          Estimated cost {formattedCostHighlight ?? '—'}
                          {costHintSummary}
                        </AlertDescription_Shadcn_>
                        <AlertDescription_Shadcn_ className="mt-1 text-[11px] text-foreground-light">
                          Reduce scanned rows or improve indexes so the planner considers cheaper
                          strategies.
                        </AlertDescription_Shadcn_>
                        <div className="mt-2 text-[11px] leading-relaxed">
                          {renderHelpLinks(COST_HELP_LINKS)}
                        </div>
                      </div>
                    </Alert_Shadcn_>
                  ) : null}
                </div>
              </Section>
            </>
          )}

          <Separator />
          <Section
            title="Rows & filters"
            icon={<Filter className="h-4 w-4" />}
            tooltip="Actual versus estimated rows and how many were removed by filters at this step."
          >
            <div className="grid gap-2">
              <div className="flex items-center text-foreground-light gap-x-2 text-xs font-semibold">
                <Rows3 size={14} />
                <span>Actual rows</span>
              </div>

              <div>
                {actualRows ?? '—'}
                {data.planRows !== undefined ? (
                  <span className="ml-1 text-foreground-lighter">
                    (estimated {formatNumber(data.planRows)})
                  </span>
                ) : null}
              </div>

              {data.rowsRemovedByFilter !== undefined ? (
                <div className="text-[11px]">
                  WHERE / filter removed {formatOrDash(data.rowsRemovedByFilter)} rows
                  {filteredPercent !== undefined ? ` (${filteredPercent}%)` : ''}
                </div>
              ) : null}
              {data.rowsRemovedByJoinFilter !== undefined ? (
                <div className="text-[11px]">
                  Join filter removed {formatOrDash(data.rowsRemovedByJoinFilter)} rows
                  {joinFilteredPercent !== undefined ? ` (${joinFilteredPercent}%)` : ''}
                </div>
              ) : null}
              {data.rowsRemovedByIndexRecheck !== undefined ? (
                <div className="text-[11px]">
                  Index recheck removed {formatOrDash(data.rowsRemovedByIndexRecheck)} rows
                  {recheckPercent !== undefined ? ` (${recheckPercent}%)` : ''}
                </div>
              ) : null}
              {data.heapFetches !== undefined ? (
                <div className="text-[11px]">Heap Fetches: {formatOrDash(data.heapFetches)}</div>
              ) : null}
            </div>
          </Section>

          {hasEstimateDetails && (
            <>
              <Separator />
              <Section
                title="Planner estimate"
                icon={<TrendingUp className="h-4 w-4" />}
                tooltip="How closely the planner's row estimate matched reality and what it means for this step."
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-foreground-light">Estimate factor</span>
                    <span className="text-sm font-medium flex items-center gap-2">
                      {estFactor ?? '—'}
                      {estimationInsight ? (
                        <Badge variant={estimationInsight.variant} size="small">
                          {estimationInsight.badgeText}
                        </Badge>
                      ) : null}
                    </span>
                  </div>
                  <dl className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-light">Direction</dt>
                      <dd className="text-foreground font-medium">
                        {estimationDirectionLabel ?? '—'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-light">Observed rows (per loop)</dt>
                      <dd className="text-foreground font-medium">{actualRows ?? '—'}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-light">Estimated rows (per loop)</dt>
                      <dd className="text-foreground font-medium">{plannedRowsPerLoop ?? '—'}</dd>
                    </div>
                    {loops > 1 ? (
                      <>
                        <div className="flex items-center justify-between">
                          <dt className="text-foreground-light">Observed rows (all loops)</dt>
                          <dd className="text-foreground font-medium">{rowsAcrossLoops ?? '—'}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="text-foreground-light">Estimated rows (all loops)</dt>
                          <dd className="text-foreground font-medium">
                            {plannedRowsAcrossLoops ?? '—'}
                          </dd>
                        </div>
                      </>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <dt className="text-foreground-light">Loops observed</dt>
                      <dd className="text-foreground font-medium">{formattedLoops}</dd>
                    </div>
                  </dl>

                  {estimationInsight ? (
                    <Alert_Shadcn_ variant={estimationInsight.variant}>
                      <TrendingUp size={16} />
                      <div>
                        <AlertTitle_Shadcn_ className="text-xs font-semibold text-foreground">
                          {estimationInsight.severity === 'critical'
                            ? 'Planner estimate is far off'
                            : 'Planner estimate needs attention'}
                        </AlertTitle_Shadcn_>
                        <AlertDescription_Shadcn_ className="mt-1 text-[11px] leading-relaxed !text-foreground">
                          {estimationInsight.summary}
                        </AlertDescription_Shadcn_>
                        <AlertDescription_Shadcn_ className="mt-1 text-[11px] leading-relaxed text-foreground-light">
                          {estimationInsight.implication}
                        </AlertDescription_Shadcn_>
                        <AlertDescription_Shadcn_ className="mt-1 text-[11px] leading-relaxed text-foreground-light">
                          {estimationInsight.guidance}
                        </AlertDescription_Shadcn_>
                        <div className="mt-2 text-[11px] leading-relaxed">
                          {renderHelpLinks(ESTIMATE_HELP_LINKS)}
                        </div>
                      </div>
                    </Alert_Shadcn_>
                  ) : estimationDirectionLabel ? (
                    <div className="text-[11px] text-foreground-light">
                      {estimationDirectionLabel}
                    </div>
                  ) : null}
                </div>
              </Section>
            </>
          )}

          {(hasBufferData || hasIOTiming) && (
            <>
              <Separator />
              <Section
                title="Buffers / IO"
                icon={<HardDrive className="h-4 w-4" />}
                tooltip="Buffer activity and I/O wait time attributable to this node, split by self and inclusive totals."
              >
                {hasBufferData ? (
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground-light">
                      <Table size={14} />
                      Block access (self / inclusive)
                    </div>
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="text-foreground-light">
                          <th className="py-1 font-normal">Type</th>
                          <th className="py-1 text-right font-normal">Self</th>
                          <th className="py-1 text-right font-normal">Inclusive</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hasSharedBuffers ? (
                          <tr>
                            <td className="py-1">Shared</td>
                            <td className="py-1 text-right">
                              {exclusiveBuffers
                                ? formatNumber(exclusiveBuffers.shared) ?? '0'
                                : '0'}
                            </td>
                            <td className="py-1 text-right">
                              {inclusiveBuffers
                                ? formatNumber(inclusiveBuffers.shared) ?? '0'
                                : '0'}
                            </td>
                          </tr>
                        ) : null}
                        {hasTempBuffers ? (
                          <tr>
                            <td className="py-1">Temp</td>
                            <td className="py-1 text-right">
                              {exclusiveBuffers ? formatNumber(exclusiveBuffers.temp) ?? '0' : '0'}
                            </td>
                            <td className="py-1 text-right">
                              {inclusiveBuffers ? formatNumber(inclusiveBuffers.temp) ?? '0' : '0'}
                            </td>
                          </tr>
                        ) : null}
                        {hasLocalBuffers ? (
                          <tr>
                            <td className="py-1">Local</td>
                            <td className="py-1 text-right">
                              {exclusiveBuffers ? formatNumber(exclusiveBuffers.local) ?? '0' : '0'}
                            </td>
                            <td className="py-1 text-right">
                              {inclusiveBuffers ? formatNumber(inclusiveBuffers.local) ?? '0' : '0'}
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                    <p className="text-foreground-light">
                      1 block = 8 KB. Self is this node only; inclusive includes descendants.
                    </p>
                  </div>
                ) : null}

                {hasIOTiming ? (
                  <div className="space-y-1 rounded border border-border bg-surface-100 px-3 py-2 text-[11px]">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <TimerReset size={14} />
                      I/O wait time
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-light">Read</span>
                      <span className="font-medium">{formatMs(data.ioReadTime) ?? '0'} ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-light">Write</span>
                      <span className="font-medium">{formatMs(data.ioWriteTime) ?? '0'} ms</span>
                    </div>
                  </div>
                ) : null}
              </Section>
            </>
          )}

          {conditionRows.some((row) => row.value) && (
            <>
              <Separator />
              <Section
                title="Conditions"
                icon={<ListFilter className="h-4 w-4" />}
                tooltip="Predicate expressions applied here. Click any row to copy the exact text."
              >
                <div className="space-y-2">
                  {conditionRows
                    .filter((row) => row.value)
                    .map((row) => (
                      <div key={row.key} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-foreground-light">
                          <span>{row.label}</span>
                        </div>
                        <div className="w-full rounded border bg-surface-100 px-2 py-1 text-left font-mono text-[11px] leading-relaxed text-foreground">
                          {row.value}
                        </div>
                      </div>
                    ))}
                </div>
              </Section>
            </>
          )}

          {outputColumns.length && (
            <>
              <Separator />
              <Section
                title="Output columns"
                icon={<Columns3 className="h-4 w-4" />}
                tooltip="Columns emitted by this node before parent nodes apply additional projections."
              >
                <div className="rounded border border-border bg-surface-100 px-2 py-2 text-[11px]">
                  <ul className="flex flex-col gap-1">
                    {outputColumns.map((column) => (
                      <li key={column} className="font-mono text-[11px] text-foreground">
                        {column}
                      </li>
                    ))}
                  </ul>
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
