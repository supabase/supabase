import type { Node } from 'reactflow'
import { type ReactNode } from 'react'
import { AlertTriangle, Clock, TimerReset, X } from 'lucide-react'

import type { PlanMeta, PlanNodeData } from './types'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Badge,
  Button,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from 'ui'
import { formatMs, formatNumber, formatOrDash } from './utils/formats'
import { COST_HELP_LINKS, SLOW_HELP_LINKS, renderHelpLinks } from './utils/node-display'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import {
  useNodeDetails,
  type OverviewMetric,
  type ExecutionMetric,
  type CostMetric,
} from './hooks/use-node-details'

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

const Section = ({
  title,
  description,
  children,
  tooltip,
}: {
  title: string
  description?: string
  children: ReactNode
  tooltip?: ReactNode
}) => {
  return (
    <section className="flex flex-col gap-2 px-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-x-1 mb-2">
          <h4>{title}</h4>
          <InfoTooltip>{tooltip}</InfoTooltip>
        </div>
        {description && <span className="text-[11px] text-foreground-light">{description}</span>}
      </div>
      <div className="space-y-4 text-xs text-foreground">{children}</div>
    </section>
  )
}

const OverviewMetricsSection = ({
  metrics,
  description,
}: {
  metrics: OverviewMetric[]
  description?: string
}) => (
  <Section
    title="Overview"
    description={description}
    tooltip="Execution time, loop counts, and planner accuracy for this node."
  >
    <div className="grid grid-cols-2 gap-2">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="flex flex-col rounded border border-border bg-surface-100 px-2 py-2"
        >
          <span className="text-[11px] text-foreground-light">{metric.label}</span>
          <span className="text-sm font-medium">{metric.value}</span>
          {metric.subLabel && (
            <span className="text-[11px] text-foreground-light">{metric.subLabel}</span>
          )}
        </div>
      ))}
    </div>
  </Section>
)

const ExecutionMetricsSection = ({
  metrics,
  slowHint,
  slowHintShare,
  slowHintTimeText,
}: {
  metrics: ExecutionMetric[]
  slowHint?: PlanNodeData['slowHint']
  slowHintShare?: number
  slowHintTimeText?: string
}) => (
  <Section
    title="Execution time"
    tooltip="Detailed runtime stats for this node, including self time and loop counts."
  >
    <div className="space-y-3">
      <ul className="flex flex-col gap-y-3 divide-y divide-dashed text-xs">
        {metrics.map((metric, index) => (
          <li
            key={metric.id}
            className={cn('flex items-center justify-between', index > 0 && 'pt-3')}
          >
            <div className="text-foreground-light">{metric.label}</div>
            <div className="font-medium">
              {metric.value}
              {metric.helper && <span className="ml-1 text-foreground-light">{metric.helper}</span>}
            </div>
          </li>
        ))}
      </ul>
      {slowHint && (
        <Alert_Shadcn_ variant={slowHint.severity === 'alert' ? 'destructive' : 'warning'}>
          <Clock size={16} />
          <div>
            <AlertTitle_Shadcn_ className="text-xs font-semibold text-foreground">
              Slow node
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_ className="mt-1 text-[11px] leading-relaxed !text-foreground">
              <p>
                Self time {slowHintTimeText ? `${slowHintTimeText} ms` : '—'} (
                {slowHintShare ?? '—'}% of total execution time).
              </p>
              <p className="text-foreground-light">
                Consider narrowing the rows earlier in the plan or adding an index to reduce work.
              </p>
            </AlertDescription_Shadcn_>
            <div className="mt-2 text-[11px] leading-relaxed">
              {renderHelpLinks(SLOW_HELP_LINKS)}
            </div>
          </div>
        </Alert_Shadcn_>
      )}
    </div>
  </Section>
)

const CostMetricsSection = ({
  metrics,
  costHint,
  formattedCostHighlight,
  costHintSummary,
}: {
  metrics: CostMetric[]
  costHint?: PlanNodeData['costHint']
  formattedCostHighlight?: string
  costHintSummary?: string
}) => (
  <Section
    title="Planner cost"
    tooltip="Planner-assigned cost units and any heuristics that flag this node."
  >
    <div className="space-y-3">
      <ul className="flex flex-col gap-y-3 divide-y divide-dashed text-xs">
        {metrics.map((metric, index) => (
          <li
            key={metric.id}
            className={cn('flex items-center justify-between', index > 0 && 'pt-3')}
          >
            <div className="text-foreground-light">{metric.label}</div>
            <div className="font-medium">{metric.value}</div>
          </li>
        ))}
      </ul>
      {costHint && (
        <Alert_Shadcn_ variant={costHint.severity === 'alert' ? 'destructive' : 'warning'}>
          <TimerReset size={16} />
          <div>
            <AlertTitle_Shadcn_ className="text-xs font-semibold text-foreground">
              Planner highlights this node
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_ className="mt-1 text-[11px] leading-relaxed !text-foreground">
              Estimated cost {formattedCostHighlight ?? '—'}
              {costHintSummary ?? ''}
            </AlertDescription_Shadcn_>
            <div className="mt-2 text-[11px] leading-relaxed">
              {renderHelpLinks(COST_HELP_LINKS)}
            </div>
          </div>
        </Alert_Shadcn_>
      )}
    </div>
  </Section>
)

const RowsSection = ({
  data,
  actualRows,
  filteredPercent,
  joinFilteredPercent,
  recheckPercent,
}: {
  data: PlanNodeData
  actualRows?: string
  filteredPercent?: number
  joinFilteredPercent?: number
  recheckPercent?: number
}) => (
  <Section
    title="Rows & filters"
    tooltip="Actual versus estimated rows and how many were removed by filters at this step."
  >
    <ul className="flex flex-col gap-y-3 divide-y divide-dashed text-xs">
      <li className="flex items-center justify-between">
        <div className="text-foreground-light">Actual rows</div>
        <div>
          <span className="font-medium">{actualRows ?? '—'}</span>
          {data.planRows !== undefined && (
            <span className="ml-1 text-foreground-light">
              (estimated {formatNumber(data.planRows)})
            </span>
          )}
        </div>
      </li>

      {data.rowsRemovedByFilter !== undefined && (
        <li className="flex items-center justify-between pt-3">
          <div className="text-foreground-light">Rows removed by WHERE filter</div>
          <div>
            <span className="font-medium">{formatOrDash(data.rowsRemovedByFilter)} rows</span>
            <span className="text-foreground-light">
              {filteredPercent !== undefined && ` (${filteredPercent}%)`}
            </span>
          </div>
        </li>
      )}
      {data.rowsRemovedByJoinFilter !== undefined && (
        <li className="flex items-center justify-between pt-3">
          <div className="text-foreground-light">Rows removed by Join filter</div>
          <div>
            <span className="font-medium">{formatOrDash(data.rowsRemovedByJoinFilter)} rows</span>
            <span className="text-foreground-light">
              {joinFilteredPercent !== undefined && ` (${joinFilteredPercent}%)`}
            </span>
          </div>
        </li>
      )}
      {data.rowsRemovedByIndexRecheck !== undefined && (
        <li className="flex items-center justify-between pt-3">
          <div className="text-foreground-light">Rows removed by Index recheck</div>
          <div>
            <span className="font-medium">{formatOrDash(data.rowsRemovedByIndexRecheck)} rows</span>
            <span className="text-foreground-light">
              {recheckPercent !== undefined && ` (${recheckPercent}%)`}
            </span>
          </div>
        </li>
      )}
      {data.heapFetches !== undefined && (
        <li className="flex items-center justify-between pt-3">
          <div className="text-foreground-light">Heap fetches</div>
          <div className="font-medium">{formatOrDash(data.heapFetches)}</div>
        </li>
      )}
    </ul>
  </Section>
)

const EstimateSection = ({ details }: { details: ReturnType<typeof useNodeDetails> }) => (
  <Section
    title="Planner estimate"
    tooltip="How closely the planner's row estimate matched reality and what it means for this step."
  >
    <div className="space-y-3">
      <ul className="flex flex-col gap-y-3 divide-y divide-dashed text-xs">
        <li className="flex items-center justify-between text-xs">
          <div className="text-foreground-light">Estimate factor</div>
          <div className="font-medium flex items-center gap-2">
            {details.estFactor ?? '—'}
            {details.estimationInsight && (
              <Badge variant={details.estimationInsight.variant} size="small">
                {details.estimationInsight.badgeText}
              </Badge>
            )}
          </div>
        </li>
        <li className="flex items-center justify-between pt-3">
          <div className="text-foreground-light">Direction</div>
          <div className="font-medium">{details.estimationDirectionLabel ?? '—'}</div>
        </li>
        <li className="flex items-center justify-between pt-3">
          <div className="text-foreground-light">Observed rows (per loop)</div>
          <div className="font-medium">{details.actualRows ?? '—'}</div>
        </li>
        <li className="flex items-center justify-between pt-3">
          <div className="text-foreground-light">Estimated rows (per loop)</div>
          <div className="font-medium">{details.plannedRowsPerLoop ?? '—'}</div>
        </li>
        {details.loops > 1 && (
          <>
            <li className="flex items-center justify-between pt-3">
              <div className="text-foreground-light">Observed rows (all loops)</div>
              <div className="font-medium">{details.rowsAcrossLoops ?? '—'}</div>
            </li>
            <li className="flex items-center justify-between pt-3">
              <div className="text-foreground-light">Estimated rows (all loops)</div>
              <div className="font-medium">{details.plannedRowsAcrossLoops ?? '—'}</div>
            </li>
          </>
        )}
        <li className="flex items-center justify-between pt-3">
          <div className="text-foreground-light">Loops observed</div>
          <div className="font-medium">{details.formattedLoops}</div>
        </li>
      </ul>

      {details.estimationInsight ? (
        <Alert_Shadcn_ variant={details.estimationInsight.variant}>
          <AlertTriangle size={16} />
          <div>
            <AlertTitle_Shadcn_ className="text-xs font-semibold text-foreground">
              {details.estimationInsight.severity === 'critical'
                ? 'Planner estimate is far off'
                : 'Planner estimate needs attention'}
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_ className="mt-1 text-[11px] leading-relaxed !text-foreground">
              {details.estimationInsight.summary}
            </AlertDescription_Shadcn_>
            <AlertDescription_Shadcn_ className="mt-1 text-[11px] leading-relaxed text-foreground-light">
              {details.estimationInsight.implication}
            </AlertDescription_Shadcn_>
            <AlertDescription_Shadcn_ className="mt-1 text-[11px] leading-relaxed text-foreground-light">
              {details.estimationInsight.guidance}
            </AlertDescription_Shadcn_>
            <div className="mt-2 text-[11px] leading-relaxed">
              {renderHelpLinks(ESTIMATE_HELP_LINKS)}
            </div>
          </div>
        </Alert_Shadcn_>
      ) : (
        details.estimationDirectionLabel && (
          <div className="text-[11px] text-foreground-light">
            {details.estimationDirectionLabel}
          </div>
        )
      )}
    </div>
  </Section>
)

const BuffersSection = ({
  details,
  data,
}: {
  details: ReturnType<typeof useNodeDetails>
  data: PlanNodeData
}) => (
  <Section
    title="Buffers / IO"
    tooltip="Buffer activity and I/O wait time attributable to this node, split by self and inclusive totals."
  >
    {details.hasBufferData && (
      <div className="space-y-2">
        <div className="text-xs font-semibold">Block access (self / inclusive)</div>
        <Table className="text-xs text-left">
          <TableHeader>
            <TableRow className="text-[11px] text-foreground-light">
              <TableHead className="h-auto px-0 py-1 text-foreground-light">Type</TableHead>
              <TableHead className="h-auto px-0 py-1 text-right font-normal text-foreground-light">
                Self
              </TableHead>
              <TableHead className="h-auto px-0 py-1 text-right font-normal text-foreground-light">
                Inclusive
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {details.hasSharedBuffers && (
              <TableRow>
                <TableCell className="px-0 py-1">Shared</TableCell>
                <TableCell className="px-0 py-1 text-right">
                  {formatNumber(details.bufferTotals.exclusive.shared) ?? '0'}
                </TableCell>
                <TableCell className="px-0 py-1 text-right">
                  {formatNumber(details.bufferTotals.inclusive.shared) ?? '0'}
                </TableCell>
              </TableRow>
            )}
            {details.hasTempBuffers && (
              <TableRow>
                <TableCell className="px-0 py-1">Temp</TableCell>
                <TableCell className="px-0 py-1 text-right">
                  {formatNumber(details.bufferTotals.exclusive.temp) ?? '0'}
                </TableCell>
                <TableCell className="px-0 py-1 text-right">
                  {formatNumber(details.bufferTotals.inclusive.temp) ?? '0'}
                </TableCell>
              </TableRow>
            )}
            {details.hasLocalBuffers && (
              <TableRow>
                <TableCell className="px-0 py-1">Local</TableCell>
                <TableCell className="px-0 py-1 text-right">
                  {formatNumber(details.bufferTotals.exclusive.local) ?? '0'}
                </TableCell>
                <TableCell className="px-0 py-1 text-right">
                  {formatNumber(details.bufferTotals.inclusive.local) ?? '0'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <p className="text-foreground-light text-[11px]">
          1 block = 8 KB. Self is this node only; inclusive includes descendants.
        </p>
      </div>
    )}

    {details.hasIOTiming && (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold">IO wait time</div>
        <ul className="flex flex-col gap-y-3 divide-y divide-dashed text-xs">
          <li className="flex items-center justify-between">
            <div className="text-foreground-light">Read</div>
            <div className="font-medium">{formatMs(data.ioReadTime) ?? '0'} ms</div>
          </li>
          <li className="flex items-center justify-between pt-3">
            <div className="text-foreground-light">Write</div>
            <div className="font-medium">{formatMs(data.ioWriteTime) ?? '0'} ms</div>
          </li>
        </ul>
      </div>
    )}
  </Section>
)

const ConditionsSection = ({
  rows,
}: {
  rows: ReturnType<typeof useNodeDetails>['conditionRows']
}) => (
  <Section
    title="Conditions"
    tooltip="Predicate expressions applied here. Click any row to copy the exact text."
  >
    <ul className="space-y-3">
      {rows
        .filter((row) => row.value)
        .map((row) => (
          <li key={row.key} className="space-y-1 text-xs">
            <span>{row.label}</span>
            <div className="w-full rounded border bg-surface-100 px-2 py-1 text-left font-mono leading-relaxed text-foreground">
              {row.value}
            </div>
          </li>
        ))}
    </ul>
  </Section>
)

const OutputColumnsSection = ({ columns }: { columns: string[] }) => (
  <Section
    title="Output columns"
    tooltip="Columns emitted by this node before parent nodes apply additional projections."
  >
    <div className="rounded border border-border bg-surface-100 px-2 py-2">
      <ul className="flex flex-col gap-1">
        {columns.map((column) => (
          <li key={column} className="font-mono text-foreground">
            {column}
          </li>
        ))}
      </ul>
    </div>
  </Section>
)

export const NodeDetailsPanel = ({
  node,
  meta,
  onClearSelection,
  variant = 'sidebar',
}: NodeDetailsPanelProps) => {
  const data = node.data
  const details = useNodeDetails(data, meta)

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
          <OverviewMetricsSection
            metrics={details.overviewMetrics}
            description={data.neverExecuted ? 'This step never executed' : undefined}
          />

          {details.hasTimeDetails && (
            <>
              <Separator />
              <ExecutionMetricsSection
                metrics={details.executionMetrics}
                slowHint={details.slowHint}
                slowHintShare={details.slowHintShare}
                slowHintTimeText={details.slowHintTimeText}
              />
            </>
          )}

          {details.hasCostDetails && (
            <>
              <Separator />
              <CostMetricsSection
                metrics={details.costMetrics}
                costHint={details.costHint}
                formattedCostHighlight={details.formattedCostHighlight}
                costHintSummary={details.costHintSummary}
              />
            </>
          )}

          <Separator />
          <RowsSection
            data={data}
            actualRows={details.actualRows}
            filteredPercent={details.filteredPercent}
            joinFilteredPercent={details.joinFilteredPercent}
            recheckPercent={details.recheckPercent}
          />

          {details.hasEstimateDetails && (
            <>
              <Separator />
              <EstimateSection details={details} />
            </>
          )}

          {(details.hasBufferData || details.hasIOTiming) && (
            <>
              <Separator />
              <BuffersSection details={details} data={data} />
            </>
          )}

          {details.conditionRows.some((row) => row.value) && (
            <>
              <Separator />
              <ConditionsSection rows={details.conditionRows} />
            </>
          )}

          {details.outputColumns.length > 0 && (
            <>
              <Separator />
              <OutputColumnsSection columns={details.outputColumns} />
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
