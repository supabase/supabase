import { type ReactNode } from 'react'
import { capitalize } from 'lodash'

import type { PlanNodeData } from '../types'
import type { MetricsVisibility, HeatmapMode } from '../contexts'
import { formatKeys, stripParens, blocksToBytes } from './formats'

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
export const sharedTooltip = (data: PlanNodeData) => {
  const incl = `incl: h=${data.sharedHit ?? 0} (${blocksToBytes(data.sharedHit)}), r=${
    data.sharedRead ?? 0
  } (${blocksToBytes(data.sharedRead)}), d=${data.sharedDirtied ?? 0} (${blocksToBytes(
    data.sharedDirtied
  )}), w=${data.sharedWritten ?? 0} (${blocksToBytes(data.sharedWritten)})`
  const self = `self: h=${data.exSharedHit ?? 0} (${blocksToBytes(
    data.exSharedHit
  )}), r=${data.exSharedRead ?? 0} (${blocksToBytes(data.exSharedRead)}), d=${
    data.exSharedDirtied ?? 0
  } (${blocksToBytes(data.exSharedDirtied)}), w=${data.exSharedWritten ?? 0} (${blocksToBytes(
    data.exSharedWritten
  )})`

  return `Shared Blocks\n${incl}\n${self}`
}

export const localTooltip = (data: PlanNodeData) => {
  const incl = `incl: h=${data.localHit ?? 0} (${blocksToBytes(data.localHit)}), r=${
    data.localRead ?? 0
  } (${blocksToBytes(data.localRead)}), d=${data.localDirtied ?? 0} (${blocksToBytes(
    data.localDirtied
  )}), w=${data.localWritten ?? 0} (${blocksToBytes(data.localWritten)})`
  const self = `self: h=${data.exLocalHit ?? 0} (${blocksToBytes(
    data.exLocalHit
  )}), r=${data.exLocalRead ?? 0} (${blocksToBytes(data.exLocalRead)}), d=${
    data.exLocalDirtied ?? 0
  } (${blocksToBytes(data.exLocalDirtied)}), w=${data.exLocalWritten ?? 0} (${blocksToBytes(
    data.exLocalWritten
  )})`

  return `Local Blocks\n${incl}\n${self}`
}

export const tempTooltip = (data: PlanNodeData) => {
  const incl = `incl: r=${data.tempRead ?? 0} (${blocksToBytes(
    data.tempRead
  )}), w=${data.tempWritten ?? 0} (${blocksToBytes(data.tempWritten)})`
  const self = `self: r=${data.exTempRead ?? 0} (${blocksToBytes(
    data.exTempRead
  )}), w=${data.exTempWritten ?? 0} (${blocksToBytes(data.exTempWritten)})`

  return `Temp Blocks\n${incl}\n${self}`
}

// Calculate removed percentage (0-100) based on removed and actual rows×loops
export const removedPercentValue = (
  data: PlanNodeData,
  removed?: number
): number | undefined => {
  const r = removed ?? 0
  const actualTotal = (data.actualRows ?? 0) * (data.actualLoops ?? 1)
  const denom = r + actualTotal
  if (denom <= 0 || r <= 0) return undefined

  return Math.round((r / denom) * 100)
}

/** Buffers rows presence helpers */
export const hasShared = (d: PlanNodeData) =>
  (d.exSharedHit ?? 0) +
    (d.exSharedRead ?? 0) +
    (d.exSharedWritten ?? 0) +
    (d.exSharedDirtied ?? 0) >
  0
export const hasTemp = (d: PlanNodeData) => (d.exTempRead ?? 0) + (d.exTempWritten ?? 0) > 0
export const hasLocal = (d: PlanNodeData) =>
  (d.exLocalHit ?? 0) + (d.exLocalRead ?? 0) + (d.exLocalWritten ?? 0) + (d.exLocalDirtied ?? 0) > 0

/**
 * Counts how many metric rows (NodeItem) will be rendered for a node,
 * based on the metric visibility toggles and the node's data.
 */
export function countBodyRows(d: PlanNodeData, vis: MetricsVisibility): number {
  let c = 0
  // Workers
  if (typeof d.workersPlanned === 'number' || typeof d.workersLaunched === 'number') c += 1
  // time
  if (vis.time && typeof d.actualTotalTime === 'number') c += 1
  if (vis.time && typeof d.exclusiveTimeMs === 'number') c += 1
  // rows
  if (vis.rows && (typeof d.actualRows === 'number' || typeof d.planRows === 'number')) c += 1
  if (vis.rows && typeof d.estFactor === 'number') c += 1
  // cost
  if (vis.cost && (typeof d.startupCost === 'number' || typeof d.totalCost === 'number')) c += 1
  if (vis.cost && typeof d.exclusiveCost === 'number') c += 1
  // width
  if (typeof d.planWidth === 'number') c += 1
  // removed rows
  if (typeof d.rowsRemovedByFilter === 'number') c += 1
  if (typeof d.rowsRemovedByJoinFilter === 'number') c += 1
  if (typeof d.rowsRemovedByIndexRecheck === 'number') c += 1
  // heap fetches
  if (typeof d.heapFetches === 'number') c += 1
  // buffers
  if (vis.buffers && hasShared(d)) c += 1
  if (vis.buffers && hasTemp(d)) c += 1
  if (vis.buffers && hasLocal(d)) c += 1
  // output
  if (vis.output && Array.isArray(d.outputCols) && d.outputCols.length > 0) c += 1
  // io time
  if (vis.buffers && (typeof d.ioReadTime === 'number' || typeof d.ioWriteTime === 'number')) c += 1
  return c
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
  constants = { HEADER_H: 22, HEADER_LINE_H: 15, ITEM_H: 22, PADDING: 16, HEATMAP_H: 3 }
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
