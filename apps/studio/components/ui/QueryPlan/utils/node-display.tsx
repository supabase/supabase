import { type ReactNode } from 'react'
import { Clock, ExternalLink, CircleDollarSign } from 'lucide-react'
import { capitalize } from 'lodash'

import type { PlanNodeData } from '../types'
import type { MetricsVisibility, HeatmapMode } from '../contexts'
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { formatKeys, stripParens, blocksToBytes, formatMs } from './formats'
import { DEFAULT_NODE_HEIGHT_CONSTANTS, type NodeHeightConstants } from '../constants'

/**
 * Helpers for keeping display logic (what we render and when) in one place.
 * Both PlanNode (UI) and the layout estimator should call these functions so
 * we never drift between what is displayed and what we reserve space for.
 */

/**
 * Returns the list of header lines rendered above the metrics list.
 * Order matches the visual rendering in PlanNode.
 */
export function computeHeaderLines(d: PlanNodeData): ReactNode[] {
  const lines: ReactNode[] = []

  // CTE/Subplan badge
  if (d.cteName) {
    lines.push(`[CTE] ${d.cteName}`)
  } else if (d.subplanName) {
    lines.push(`[Subplan] ${d.subplanName}`)
  }
  // Parallel badge
  if (d.parallelAware) {
    lines.push('[Parallel]')
  }

  // Keys (Group/Sort with presorted markers)
  const groupKeys = formatKeys(d.groupKey)
  if (groupKeys)
    lines.push(
      <>
        <span className="text-foreground-light">by</span> {groupKeys}
      </>
    )
  const sortKeys = formatKeys(d.sortKey, d.presortedKey)
  if (sortKeys)
    lines.push(
      <>
        <span className="text-foreground-light">by</span> {sortKeys}
      </>
    )

  // Join type
  if (d.joinType) {
    lines.push(
      <>
        {capitalize(d.joinType)} <span className="text-foreground-light">join</span>
      </>
    )
  }

  // Join condition or relation
  const cond = d.hashCond ?? d.mergeCond ?? d.joinFilter
  if (cond) {
    lines.push(
      <>
        <span className="text-foreground-light">on</span> {stripParens(cond)}
      </>
    )
  } else if (d.relationName) {
    lines.push(
      <>
        <span className="text-foreground-light">on</span> {d.relationName}
        {d.alias ? (
          <>
            {' '}
            <span className="text-foreground-light">as</span> {d.alias}
          </>
        ) : null}
      </>
    )
  }

  // Index name when label includes "index"
  if (d.indexName && d.label?.toLowerCase().includes('index')) {
    lines.push(
      <>
        <span className="text-foreground-light">using</span> {d.indexName}
      </>
    )
  }

  return lines
}

/**
 * Tooltip formatters and value helpers for metric rows
 */
function formatSharedBlocksLine(
  prefix: string,
  hit?: number,
  read?: number,
  dirtied?: number,
  written?: number
): string {
  const h = hit ?? 0
  const r = read ?? 0
  const d = dirtied ?? 0
  const w = written ?? 0

  return `${prefix}: h=${h} (${blocksToBytes(hit)}), r=${r} (${blocksToBytes(read)}), d=${d} (${blocksToBytes(
    dirtied
  )}), w=${w} (${blocksToBytes(written)})`
}

export function sharedTooltip(data: PlanNodeData) {
  const incl = formatSharedBlocksLine(
    'incl',
    data.sharedHit,
    data.sharedRead,
    data.sharedDirtied,
    data.sharedWritten
  )
  const self = formatSharedBlocksLine(
    'self',
    data.exSharedHit,
    data.exSharedRead,
    data.exSharedDirtied,
    data.exSharedWritten
  )

  return `Shared Blocks\n${incl}\n${self}`
}

export function localTooltip(data: PlanNodeData) {
  const incl = formatSharedBlocksLine(
    'incl',
    data.localHit,
    data.localRead,
    data.localDirtied,
    data.localWritten
  )
  const self = formatSharedBlocksLine(
    'self',
    data.exLocalHit,
    data.exLocalRead,
    data.exLocalDirtied,
    data.exLocalWritten
  )

  return `Local Blocks\n${incl}\n${self}`
}

function formatReadWriteLine(prefix: string, read?: number, written?: number): string {
  const r = read ?? 0
  const w = written ?? 0
  return `${prefix}: r=${r} (${blocksToBytes(read)}), w=${w} (${blocksToBytes(written)})`
}

export function tempTooltip(data: PlanNodeData) {
  const incl = formatReadWriteLine('incl', data.tempRead, data.tempWritten)
  const self = formatReadWriteLine('self', data.exTempRead, data.exTempWritten)

  return `Temp Blocks\n${incl}\n${self}`
}

// Calculate removed percentage (0-100) based on removed and actual rows×loops
export function removedPercentValue(data: PlanNodeData, removed?: number): number | undefined {
  const r = removed ?? 0
  const actualTotal = (data.actualRows ?? 0) * (data.actualLoops ?? 1)
  const denom = r + actualTotal
  if (denom <= 0 || r <= 0) return undefined

  return Math.round((r / denom) * 100)
}

/** Buffers rows presence helpers */
export function hasShared(d: PlanNodeData) {
  return (
    (d.exSharedHit ?? 0) +
      (d.exSharedRead ?? 0) +
      (d.exSharedWritten ?? 0) +
      (d.exSharedDirtied ?? 0) >
    0
  )
}

export function hasTemp(d: PlanNodeData) {
  return (d.exTempRead ?? 0) + (d.exTempWritten ?? 0) > 0
}

export function hasLocal(d: PlanNodeData) {
  return (
    (d.exLocalHit ?? 0) + (d.exLocalRead ?? 0) + (d.exLocalWritten ?? 0) + (d.exLocalDirtied ?? 0) >
    0
  )
}

/**
 * Counts how many metric rows (NodeItem) will be rendered for a node,
 * based on the metric visibility toggles and the node's data.
 */
export function countBodyRows(d: PlanNodeData, vis: MetricsVisibility): number {
  let count = 0
  // Workers
  if (d.workersPlanned !== undefined || d.workersLaunched !== undefined) count += 1
  // time
  if (vis.time && d.actualTotalTime !== undefined) count += 1
  if (vis.time && d.exclusiveTimeMs !== undefined) count += 1
  // rows
  if (vis.rows && (d.actualRows !== undefined || d.planRows !== undefined)) count += 1
  if (vis.rows && d.estFactor !== undefined) count += 1
  // cost
  if (vis.cost && (d.startupCost !== undefined || d.totalCost !== undefined)) count += 1
  if (vis.cost && d.exclusiveCost !== undefined) count += 1
  // width
  if (d.planWidth !== undefined) count += 1
  // removed rows
  if (d.rowsRemovedByFilter !== undefined) count += 1
  if (d.rowsRemovedByJoinFilter !== undefined) count += 1
  if (d.rowsRemovedByIndexRecheck !== undefined) count += 1
  // heap fetches
  if (d.heapFetches !== undefined) count += 1
  // buffers
  if (vis.buffers && hasShared(d)) count += 1
  if (vis.buffers && hasTemp(d)) count += 1
  if (vis.buffers && hasLocal(d)) count += 1
  // output
  if (vis.output && Array.isArray(d.outputCols) && d.outputCols.length > 0) count += 1
  // io time
  if (vis.buffers && (d.ioReadTime !== undefined || d.ioWriteTime !== undefined)) count += 1

  return count
}

/**
 * Returns the estimated node height using fixed row heights so that we can
 * compute the Dagre layout without measuring the DOM.
 *
 * constants.HEADER_H      — fixed height for the header strip (title line)
 * constants.HEADER_LINE_H — fixed height for each header sub-line (by/on/etc.)
 * constants.ITEM_H        — fixed height for each metric row (NodeItem)
 * constants.PADDING       — additional vertical padding to reduce overlap
 * constants.HEATMAP_H     — height of the heatmap bar (only when enabled)
 */
export function estimateNodeHeight(
  d: PlanNodeData,
  vis: MetricsVisibility,
  heatmapMode: HeatmapMode,
  constants: NodeHeightConstants = DEFAULT_NODE_HEIGHT_CONSTANTS
): number {
  const headerLines = computeHeaderLines(d).length
  const bodyRows = countBodyRows(d, vis)
  const heat = heatmapMode !== 'none' ? constants.HEATMAP_H : 0

  return (
    constants.HEADER_H +
    heat +
    headerLines * constants.HEADER_LINE_H +
    bodyRows * constants.ITEM_H +
    constants.PADDING
  )
}

/**
 * Builds the header hint badges/tooltips for a plan node.
 */
export const SLOW_HELP_LINKS = [
  {
    label: 'Examine query performance',
    href: 'https://supabase.com/docs/guides/platform/performance#examining-query-performance',
  },
  {
    label: 'Managing Indexes',
    href: 'https://supabase.com/docs/guides/database/postgres/indexes',
  },
]

export const COST_HELP_LINKS = [
  {
    label: 'Examine query performance',
    href: 'https://supabase.com/docs/guides/platform/performance#examining-query-performance',
  },
]

export const renderHelpLinks = (links: { label: string; href: string }[]) => (
  <ul className="flex flex-col gap-1 pt-1 text-[11px]">
    {links.map((link) => (
      <li key={link.href}>
        <a
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-x-1 underline underline-offset-2 text-foreground-light hover:text-foreground"
        >
          <span>{link.label}</span>
          <ExternalLink size={10} strokeWidth={1.5} />
        </a>
      </li>
    ))}
  </ul>
)

export const buildHints = (data: PlanNodeData): JSX.Element[] => {
  const hints: JSX.Element[] = []

  if (data.slowHint) {
    const share = Math.round(data.slowHint.selfTimeShare * 100)
    const slowTime = formatMs(data.slowHint.selfTimeMs) ?? data.slowHint.selfTimeMs.toFixed(2)

    hints.push(
      <Tooltip key="slow-hint">
        <TooltipTrigger className="flex">
          <Badge
            size="small"
            variant={data.slowHint.severity === 'alert' ? 'destructive' : 'warning'}
            aria-label="Slow node"
            className="p-0.5 rounded"
          >
            <Clock size={10} strokeWidth={1.5} />
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="space-y-1 max-w-[220px] pb-2">
          <p className="font-medium text-xs">Slow node</p>
          <p className="text-[11px]">
            Self time {slowTime} ms ({share}% of total execution time).
          </p>
          <p className="text-[11px] text-foreground-light">
            Consider narrowing the rows earlier in the plan or adding an index to reduce work.
          </p>
          {renderHelpLinks(SLOW_HELP_LINKS)}
        </TooltipContent>
      </Tooltip>
    )
  }

  if (data.costHint) {
    const exclusiveShare =
      data.costHint.selfCostShare !== undefined
        ? Math.round((data.costHint.selfCostShare ?? 0) * 100)
        : undefined
    const maxTotalCostShare =
      data.costHint.maxTotalCostShare !== undefined
        ? Math.round((data.costHint.maxTotalCostShare ?? 0) * 100)
        : undefined

    let shareSummary: string | undefined
    if (maxTotalCostShare !== undefined && maxTotalCostShare >= (exclusiveShare ?? -1)) {
      shareSummary = ` (~${maxTotalCostShare}% of the plan's highest total cost).`
    } else if (exclusiveShare !== undefined) {
      shareSummary = ` (~${exclusiveShare}% of exclusive plan cost).`
    }

    hints.push(
      <Tooltip key="cost-hint">
        <TooltipTrigger className="flex">
          <Badge
            size="small"
            variant={data.costHint.severity === 'alert' ? 'destructive' : 'warning'}
            aria-label="Cost is high"
            className="p-0.5 rounded"
          >
            <CircleDollarSign size={10} strokeWidth={1.5} />
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="space-y-1 max-w-[220px] pb-2">
          <p className="font-medium text-xs">Cost is high</p>
          <p className="text-[11px]">
            Estimated cost {(data.totalCost ?? data.costHint.selfCost ?? 0).toFixed(2)}
            {shareSummary ?? '.'}
          </p>
          <p className="text-[11px] text-foreground-light">
            Reduce scanned rows or improve indexes so the planner considers cheaper strategies.
          </p>
          {renderHelpLinks(COST_HELP_LINKS)}
        </TooltipContent>
      </Tooltip>
    )
  }

  return hints
}
