import type { Node } from 'reactflow'
import { Fragment, type ReactNode } from 'react'
import { AlertTriangle, Clock, Layers, Rows3, Table, TimerReset, X } from 'lucide-react'

import type { PlanMeta, PlanNodeData } from './types'
import { Badge, Button, Separator } from 'ui'
import { formatMs, formatNumber, formatOrDash } from './utils/formats'
import { hasLocal, hasShared, hasTemp, removedPercentValue } from './utils/node-display'

type NodeDetailsPanelProps = {
  node: Node<PlanNodeData> | null
  meta?: PlanMeta
  onClearSelection: () => void
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
}: {
  title: string
  description?: string
  children: ReactNode
}) => {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground-light">{title}</h3>
        {description ? (
          <span className="text-[11px] text-foreground-light">{description}</span>
        ) : null}
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

export const NodeDetailsPanel = ({ node, meta, onClearSelection }: NodeDetailsPanelProps) => {
  const data = node?.data

  const loops = data?.actualLoops ?? 1
  const formattedLoops = formatNumber(loops) ?? `${loops}`
  const totalTimePerLoop = data?.actualTotalTime
  const totalTimeAllLoops = loops > 1 && totalTimePerLoop ? totalTimePerLoop * loops : undefined
  const formattedTotalTimePerLoop = formatMs(totalTimePerLoop)
  const formattedTotalTimeAllLoops = totalTimeAllLoops ? formatMs(totalTimeAllLoops) : undefined
  const formattedSelfTime = formatMs(data?.exclusiveTimeMs)
  const executionShare =
    data?.exclusiveTimeMs !== undefined && meta?.executionTime
      ? formatPercent((data.exclusiveTimeMs / meta.executionTime) * 100)
      : undefined
  const actualRows = data?.actualRows !== undefined ? formatNumber(data.actualRows) : undefined
  const rowsAcrossLoops =
    data?.actualRows !== undefined
      ? formatNumber((data.actualRows ?? 0) * Math.max(loops, 1))
      : undefined
  const estFactor =
    data?.estFactor !== undefined
      ? `${data.estFactor.toFixed(data.estFactor >= 10 ? 0 : 2)}×`
      : undefined

  const filteredPercent = data ? removedPercentValue(data, data.rowsRemovedByFilter) : undefined
  const joinFilteredPercent = data
    ? removedPercentValue(data, data.rowsRemovedByJoinFilter)
    : undefined
  const recheckPercent = data
    ? removedPercentValue(data, data.rowsRemovedByIndexRecheck)
    : undefined

  const exclusiveBuffers = data ? exclusiveBufferTotal(data) : undefined
  const inclusiveBuffers = data ? inclusiveBufferTotal(data) : undefined

  const hasSharedBuffers = data ? hasShared(data) : false
  const hasTempBuffers = data ? hasTemp(data) : false
  const hasLocalBuffers = data ? hasLocal(data) : false
  const hasBufferData = hasSharedBuffers || hasTempBuffers || hasLocalBuffers
  const hasIOTiming = (data?.ioReadTime ?? 0) + (data?.ioWriteTime ?? 0) > 0

  const plannerEstimates: KeyValue[] = [
    { key: 'startup', label: 'Startup cost', value: data?.startupCost?.toFixed(2) },
    { key: 'total', label: 'Total cost', value: data?.totalCost?.toFixed(2) },
    {
      key: 'planRows',
      label: 'Estimated rows',
      value: data?.planRows ? formatNumber(data.planRows) : undefined,
    },
    {
      key: 'planWidth',
      label: 'Row width',
      value: data?.planWidth ? `${data.planWidth} B` : undefined,
    },
  ]

  const conditionRows: ConditionRow[] = [
    { key: 'filter', label: 'Filter', value: data?.filter },
    { key: 'hash-cond', label: 'Hash condition', value: data?.hashCond },
    { key: 'index-cond', label: 'Index recheck', value: data?.recheckCond },
    { key: 'join-filter', label: 'Join filter', value: data?.joinFilter },
    { key: 'merge-cond', label: 'Merge condition', value: data?.mergeCond },
    { key: 'index', label: 'Index condition', value: data?.indexCond },
  ]

  const outputColumns = data?.outputCols ?? []

  const hasHints = Boolean(data?.slowHint || data?.costHint)

  return (
    <aside className="flex w-[340px] min-w-[280px] max-w-[360px] flex-col border-l border-border bg-sidebar shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-3 py-2 h-[41px]">
        <div className="flex items-center gap-2">
          <span className="truncate text-xs font-semibold text-foreground">
            {data?.label ?? 'Select a node'}
          </span>
          {data?.joinType ? (
            <Badge size="small" variant="outline" className="uppercase">
              {data.joinType}
            </Badge>
          ) : null}
          {data?.parallelAware ? (
            <Badge size="small" variant="outline" className="uppercase">
              Parallel
            </Badge>
          ) : null}
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

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {!data ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-foreground-light">
            <Layers size={18} />
            <p className="text-[12px] leading-relaxed">
              Select a node to inspect its metrics here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Section
              title="Overview"
              description={data.neverExecuted ? 'This step never executed' : undefined}
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
                <div className="flex flex-col rounded border border-border bg-surface-100 px-2 py-2">
                  <span className="text-[11px] text-foreground-light">Estimate factor</span>
                  <span className="text-sm font-medium">{estFactor ?? '—'}</span>
                  {data.estDirection && data.estDirection !== 'none' ? (
                    <span className="text-[11px] text-foreground-light">
                      {data.estDirection === 'over'
                        ? 'Planner overestimated'
                        : 'Planner underestimated'}
                    </span>
                  ) : null}
                </div>
              </div>
            </Section>

            {hasHints ? (
              <>
                <Separator />
                <Section title="Attention needed">
                  <div className="flex flex-col gap-2">
                    {data.slowHint ? (
                      <div className="rounded border border-warning/60 bg-warning/10 px-2 py-2 text-[11px] text-foreground">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <Clock size={12} />
                          High self-time node
                        </div>
                        <p className="mt-1 leading-relaxed">
                          This step alone spent {formatMs(data.slowHint.selfTimeMs)} ms, taking
                          {Math.round(data.slowHint.selfTimeShare * 100)}% of total runtime.
                        </p>
                        <p className="mt-1 text-foreground-light">
                          Consider filtering earlier in the plan or adding supporting indexes.
                        </p>
                      </div>
                    ) : null}
                    {data.costHint ? (
                      <div className="rounded border border-warning/60 bg-warning/10 px-2 py-2 text-[11px] text-foreground">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <AlertTriangle size={12} />
                          Planner flagged as expensive
                        </div>
                        <p className="mt-1 leading-relaxed">
                          Estimated cost{' '}
                          {data.totalCost?.toFixed(2) ?? data.costHint.selfCost?.toFixed(2) ?? '—'}
                          stands out in this plan.
                        </p>
                        <p className="mt-1 text-foreground-light">
                          Try refreshing statistics or rewriting the query to steer the planner
                          toward a cheaper path.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </Section>
              </>
            ) : null}

            <Separator />
            <Section title="Rows & filters">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Rows3 size={14} className="text-foreground-light" />
                  <div className="flex flex-col text-[11px]">
                    <span className="text-xs text-foreground">Actual rows</span>
                    <span className="text-foreground-light">
                      {actualRows ?? '—'}
                      {data.planRows !== undefined ? (
                        <span className="ml-1 text-foreground-lighter">
                          (estimated {formatNumber(data.planRows)})
                        </span>
                      ) : null}
                    </span>
                  </div>
                </div>
                {data.rowsRemovedByFilter !== undefined ? (
                  <div className="rounded border border-border px-2 py-1 text-[11px]">
                    WHERE / filter removed {formatOrDash(data.rowsRemovedByFilter)} rows
                    {filteredPercent !== undefined ? ` (${filteredPercent}%)` : ''}
                  </div>
                ) : null}
                {data.rowsRemovedByJoinFilter !== undefined ? (
                  <div className="rounded border border-border px-2 py-1 text-[11px]">
                    Join filter removed {formatOrDash(data.rowsRemovedByJoinFilter)} rows
                    {joinFilteredPercent !== undefined ? ` (${joinFilteredPercent}%)` : ''}
                  </div>
                ) : null}
                {data.rowsRemovedByIndexRecheck !== undefined ? (
                  <div className="rounded border border-border px-2 py-1 text-[11px]">
                    Index recheck removed {formatOrDash(data.rowsRemovedByIndexRecheck)} rows
                    {recheckPercent !== undefined ? ` (${recheckPercent}%)` : ''}
                  </div>
                ) : null}
                {data.heapFetches !== undefined ? (
                  <div className="rounded border border-border px-2 py-1 text-[11px]">
                    Heap Fetches: {formatOrDash(data.heapFetches)}
                  </div>
                ) : null}
              </div>
            </Section>

            <Separator className="bg-border" />
            <Section title="Planner estimates">
              <dl className="grid grid-cols-2 gap-2 text-[11px]">
                {plannerEstimates.map((item) => (
                  <Fragment key={item.key}>
                    <dt className="text-foreground-light">{item.label}</dt>
                    <dd className="text-foreground text-right">{item.value ?? '—'}</dd>
                  </Fragment>
                ))}
              </dl>
            </Section>

            {hasBufferData || hasIOTiming ? (
              <>
                <Separator />
                <Section title="Buffers / IO">
                  {hasBufferData ? (
                    <div className="space-y-2 text-[11px]">
                      <div className="flex items-center gap-2 text-xs font-semibold">
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
                                {exclusiveBuffers
                                  ? formatNumber(exclusiveBuffers.temp) ?? '0'
                                  : '0'}
                              </td>
                              <td className="py-1 text-right">
                                {inclusiveBuffers
                                  ? formatNumber(inclusiveBuffers.temp) ?? '0'
                                  : '0'}
                              </td>
                            </tr>
                          ) : null}
                          {hasLocalBuffers ? (
                            <tr>
                              <td className="py-1">Local</td>
                              <td className="py-1 text-right">
                                {exclusiveBuffers
                                  ? formatNumber(exclusiveBuffers.local) ?? '0'
                                  : '0'}
                              </td>
                              <td className="py-1 text-right">
                                {inclusiveBuffers
                                  ? formatNumber(inclusiveBuffers.local) ?? '0'
                                  : '0'}
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
            ) : null}

            {conditionRows.some((row) => row.value) ? (
              <>
                <Separator />
                <Section title="Conditions">
                  <div className="space-y-2">
                    {conditionRows
                      .filter((row) => row.value)
                      .map((row) => (
                        <div key={row.key} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-foreground-light">
                            <span>{row.label}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!row.value || typeof navigator === 'undefined') return
                              navigator.clipboard?.writeText(row.value).catch(() => {})
                            }}
                            title="Click to copy"
                            className="w-full rounded border border-border bg-surface-100 px-2 py-1 text-left font-mono text-[11px] leading-relaxed text-foreground hover:border-border-stronger"
                          >
                            {row.value}
                          </button>
                        </div>
                      ))}
                  </div>
                </Section>
              </>
            ) : null}

            {outputColumns.length ? (
              <>
                <Separator />
                <Section title="Output columns">
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
            ) : null}

            {data.raw ? (
              <>
                <Separator />
                <Section title="Raw JSON">
                  <Button
                    type="dashed"
                    size="tiny"
                    onClick={() => {
                      if (typeof navigator === 'undefined') return
                      const payload = JSON.stringify(data.raw ?? {}, null, 2)
                      navigator.clipboard?.writeText(payload).catch(() => {})
                    }}
                    className="self-start"
                  >
                    Copy JSON
                  </Button>
                </Section>
              </>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  )
}
