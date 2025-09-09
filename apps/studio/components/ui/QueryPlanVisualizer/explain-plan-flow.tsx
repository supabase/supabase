import { useTheme } from 'next-themes'
import { useMemo, useState, createContext, useContext } from 'react'
import { Workflow, Check } from 'lucide-react'
import { capitalize } from 'lodash'
import ReactFlow, {
  Background,
  BackgroundVariant,
  MiniMap,
  Position,
  Handle,
  type Node,
  type Edge,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { cn, copyToClipboard } from 'ui'
import { Checkbox } from '@ui/components/shadcn/ui/checkbox'
import { Label } from '@ui/components/shadcn/ui/label'
import { Button } from '@ui/components/shadcn/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/shadcn/ui/select'
import type { RawPlan, PlanRoot, PlanMeta, PlanNodeData, Agg } from './types'
import { NODE_TYPE, DEFAULT_NODE_WIDTH, HIDDEN_NODE_CONNECTOR } from './constants'
import { getLayoutedElementsViaDagre } from './layout'

type ExplainPlanFlowProps = {
  json: string
}

type MetricsVisibility = {
  time: boolean
  rows: boolean
  cost: boolean
  buffers: boolean
  output: boolean
}

const MetricsVisibilityContext = createContext<MetricsVisibility>({
  time: true,
  rows: true,
  cost: true,
  buffers: true,
  output: true,
})

type HeatmapMode = 'none' | 'time' | 'rows' | 'cost'
type HeatmapMeta = {
  mode: HeatmapMode
  maxTime: number
  maxRows: number
  maxCost: number
}
const HeatmapContext = createContext<HeatmapMeta>({
  mode: 'none',
  maxTime: 1,
  maxRows: 1,
  maxCost: 1,
})

const zeroAgg = (): Agg => ({
  timeIncl: 0,
  costIncl: 0,
  sharedHit: 0,
  sharedRead: 0,
  sharedDirtied: 0,
  sharedWritten: 0,
  localHit: 0,
  localRead: 0,
  localDirtied: 0,
  localWritten: 0,
  tempRead: 0,
  tempWritten: 0,
})

const buildGraphFromPlan = (
  planJson: PlanRoot[]
): {
  nodes: Node<PlanNodeData>[]
  edges: Edge[]
  subplanRoots: { name: string; id: string }[]
} => {
  const nodes: Node<PlanNodeData>[] = []
  const edges: Edge[] = []
  const subplanRoots: { name: string; id: string }[] = []

  // Helper: Recursively add plan nodes, propagating subplan context.
  const addPlan = (
    plan: RawPlan,
    parentId?: string,
    index: number = 0,
    currentSubplanName?: string
  ): Agg => {
    const id = parentId ? `${parentId}-${index}` : 'root'
    const label = plan['Node Type'] ?? 'Node'
    // Compute current subplan context for this node and descendants
    const subName = plan['Subplan Name'] ?? currentSubplanName

    // If this node is a subplan root, record it
    if (plan['Subplan Name']) {
      subplanRoots.push({ name: plan['Subplan Name'], id })
    }

    // Recurse first to get children aggregates for exclusive computation
    const children: RawPlan[] = plan['Plans'] ?? []
    let childAgg: Agg = zeroAgg()
    children.forEach((child, i) => {
      const agg = addPlan(child, id, i, subName)
      // create edge to child now that we know ids
      const childId = `${id}-${i}`
      edges.push({ id: `${id}->${childId}`, source: id, target: childId, animated: true })
      // accumulate child inclusive totals
      childAgg.timeIncl += agg.timeIncl
      childAgg.costIncl += agg.costIncl
      childAgg.sharedHit += agg.sharedHit
      childAgg.sharedRead += agg.sharedRead
      childAgg.sharedDirtied += agg.sharedDirtied
      childAgg.sharedWritten += agg.sharedWritten
      childAgg.localHit += agg.localHit
      childAgg.localRead += agg.localRead
      childAgg.localDirtied += agg.localDirtied
      childAgg.localWritten += agg.localWritten
      childAgg.tempRead += agg.tempRead
      childAgg.tempWritten += agg.tempWritten
    })

    // Inclusive values for this node (per Postgres: times/costs are inclusive)
    const loops = plan['Actual Loops'] ?? 1
    const nodeTimeIncl = (plan['Actual Total Time'] ?? 0) * loops
    const nodeCostIncl = plan['Total Cost'] ?? 0

    // Estimation factor calculation
    const actualRowsPerLoop = plan['Actual Rows'] ?? 0
    const actualRowsTotal = actualRowsPerLoop * loops
    const planRowsEst = plan['Plan Rows'] ?? 0
    const estFactor = planRowsEst > 0 ? actualRowsTotal / planRowsEst : undefined

    const nodeSharedHit = plan['Shared Hit Blocks'] ?? 0
    const nodeSharedRead = plan['Shared Read Blocks'] ?? 0
    const nodeSharedDirtied = plan['Shared Dirtied Blocks'] ?? 0
    const nodeSharedWritten = plan['Shared Written Blocks'] ?? 0
    const nodeLocalHit = plan['Local Hit Blocks'] ?? 0
    const nodeLocalRead = plan['Local Read Blocks'] ?? 0
    const nodeLocalDirtied = plan['Local Dirtied Blocks'] ?? 0
    const nodeLocalWritten = plan['Local Written Blocks'] ?? 0
    const nodeTempRead = plan['Temp Read Blocks'] ?? 0
    const nodeTempWritten = plan['Temp Written Blocks'] ?? 0

    // Exclusive (self) = node inclusive - sum(children inclusive)
    const exclusiveTimeMs = Math.max(nodeTimeIncl - childAgg.timeIncl, 0)
    const exclusiveCost = Math.max(nodeCostIncl - childAgg.costIncl, 0)
    const exSharedHit = Math.max(nodeSharedHit - childAgg.sharedHit, 0)
    const exSharedRead = Math.max(nodeSharedRead - childAgg.sharedRead, 0)
    const exSharedDirtied = Math.max(nodeSharedDirtied - childAgg.sharedDirtied, 0)
    const exSharedWritten = Math.max(nodeSharedWritten - childAgg.sharedWritten, 0)
    const exLocalHit = Math.max(nodeLocalHit - childAgg.localHit, 0)
    const exLocalRead = Math.max(nodeLocalRead - childAgg.localRead, 0)
    const exLocalDirtied = Math.max(nodeLocalDirtied - childAgg.localDirtied, 0)
    const exLocalWritten = Math.max(nodeLocalWritten - childAgg.localWritten, 0)
    const exTempRead = Math.max(nodeTempRead - childAgg.tempRead, 0)
    const exTempWritten = Math.max(nodeTempWritten - childAgg.tempWritten, 0)

    // Build PlanNodeData with subplan/cte context
    const data: PlanNodeData = {
      label,
      joinType: plan['Join Type'],
      startupCost: plan['Startup Cost'],
      totalCost: plan['Total Cost'],
      planRows: plan['Plan Rows'],
      planWidth: plan['Plan Width'],
      relationName: plan['Relation Name'],
      alias: plan['Alias'] ?? plan.Alias,
      filter: plan['Filter'],
      hashCond: plan['Hash Cond'],
      indexCond: plan['Index Cond'],
      recheckCond: plan['Recheck Cond'],
      mergeCond: plan['Merge Cond'],
      joinFilter: plan['Join Filter'],
      parallelAware: plan['Parallel Aware'],
      asyncCapable: plan['Async Capable'],
      parentRelationship: plan['Parent Relationship'],
      scanDirection: plan['Scan Direction'],
      indexName: plan['Index Name'],
      orderBy: plan['Order By'],
      // ANALYZE
      actualStartupTime: plan['Actual Startup Time'],
      actualTotalTime: plan['Actual Total Time'],
      actualRows: plan['Actual Rows'],
      actualLoops: plan['Actual Loops'],
      estFactor: estFactor,
      estActualTotalRows: actualRowsTotal,
      rowsRemovedByFilter: plan['Rows Removed by Filter'],
      rowsRemovedByIndexRecheck: plan['Rows Removed by Index Recheck'],
      heapFetches: plan['Heap Fetches'],
      outputCols: plan['Output'],
      // BUFFERS (inclusive values kept as-is for reference if needed)
      sharedHit: nodeSharedHit,
      sharedRead: nodeSharedRead,
      sharedDirtied: nodeSharedDirtied,
      sharedWritten: nodeSharedWritten,
      localHit: nodeLocalHit,
      localRead: nodeLocalRead,
      localDirtied: nodeLocalDirtied,
      localWritten: nodeLocalWritten,
      tempRead: nodeTempRead,
      tempWritten: nodeTempWritten,
      ioReadTime: plan['I/O Read Time'],
      ioWriteTime: plan['I/O Write Time'],
      // Exclusive (derived)
      exclusiveTimeMs,
      exclusiveCost,
      exSharedHit,
      exSharedRead,
      exSharedDirtied,
      exSharedWritten,
      exLocalHit,
      exLocalRead,
      exLocalDirtied,
      exLocalWritten,
      exTempRead,
      exTempWritten,
      // MISC
      sortMethod: plan['Sort Method'],
      sortSpaceUsed: plan['Sort Space Used'],
      sortSpaceType: plan['Sort Space Type'],
      // Subplan/CTE context
      subplanName: plan['Subplan Name'],
      cteName: plan['CTE Name'],
      // Raw JSON for detail panel
      raw: plan,
    }
    // If a subplan context is inherited and not at the root, propagate it for badge display
    if (subName && subName !== plan['Subplan Name']) {
      data.subplanName = subName
    }
    nodes.push({ id, type: NODE_TYPE, data, position: { x: 0, y: 0 } })

    // Return this node's inclusive totals so that the parent can compute exclusives
    return {
      timeIncl: nodeTimeIncl,
      costIncl: nodeCostIncl,
      sharedHit: nodeSharedHit,
      sharedRead: nodeSharedRead,
      sharedDirtied: nodeSharedDirtied,
      sharedWritten: nodeSharedWritten,
      localHit: nodeLocalHit,
      localRead: nodeLocalRead,
      localDirtied: nodeLocalDirtied,
      localWritten: nodeLocalWritten,
      tempRead: nodeTempRead,
      tempWritten: nodeTempWritten,
    }
  }

  if (Array.isArray(planJson) && planJson.length > 0 && planJson[0].Plan) {
    addPlan(planJson[0].Plan)
  }

  return { ...getLayoutedElementsViaDagre(nodes, edges), subplanRoots }
}

const stripParens = (s: string) => s.replace(/^\((.*)\)$/, '$1')

// Buffers tooltips helpers
const blocksToBytes = (blocks?: number) => {
  const b = (blocks ?? 0) * 8192 // 8kB per block
  if (!b) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = b
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(1)} ${units[i]}`
}

/**
 * @see: https://github.com/wbkd/react-flow/discussions/2698
 */
const PlanNode = ({ data }: { data: PlanNodeData }) => {
  const itemHeight = 'h-[22px]'
  const vis = useContext(MetricsVisibilityContext)
  const heat = useContext(HeatmapContext)

  const headerLines: string[] = []
  // Insert CTE/Subplan badge at the top of the header lines if present
  if (data.cteName) {
    headerLines.unshift(`[CTE] ${data.cteName}`)
  } else if (data.subplanName) {
    headerLines.unshift(`[Subplan] ${data.subplanName}`)
  }
  if (data.joinType) headerLines.push(`${capitalize(data.joinType)} join`)

  // Only show join-related conditions in header; exclude index/recheck/filter conditions
  const cond = data.hashCond ?? data.mergeCond ?? data.joinFilter
  if (cond) {
    headerLines.push(`on ${stripParens(cond)}`)
  } else if (data.relationName) {
    headerLines.push(`on ${data.relationName}${data.alias ? ` as ${data.alias}` : ''}`)
  }

  if (data.indexName && data.label.toLowerCase().includes('index')) {
    headerLines.push(`using ${data.indexName}`)
  }

  // Prepare compact buffers summary lines (show only if any > 0)
  const hasShared =
    (data.exSharedHit ?? 0) +
      (data.exSharedRead ?? 0) +
      (data.exSharedWritten ?? 0) +
      (data.exSharedDirtied ?? 0) >
    0
  const hasTemp = (data.exTempRead ?? 0) + (data.exTempWritten ?? 0) > 0
  const hasLocal =
    (data.exLocalHit ?? 0) +
      (data.exLocalRead ?? 0) +
      (data.exLocalWritten ?? 0) +
      (data.exLocalDirtied ?? 0) >
    0

  const sharedTooltip = () => {
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

  const localTooltip = () => {
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

  const tempTooltip = () => {
    const incl = `incl: r=${data.tempRead ?? 0} (${blocksToBytes(
      data.tempRead
    )}), w=${data.tempWritten ?? 0} (${blocksToBytes(data.tempWritten)})`
    const self = `self: r=${data.exTempRead ?? 0} (${blocksToBytes(
      data.exTempRead
    )}), w=${data.exTempWritten ?? 0} (${blocksToBytes(data.exTempWritten)})`
    return `Temp Blocks\n${incl}\n${self}`
  }

  // Heatmap progress bar (time/rows/cost)
  const valueForHeat = (() => {
    switch (heat.mode) {
      case 'time':
        return (data.exclusiveTimeMs ?? 0) || (data.actualTotalTime ?? 0) * (data.actualLoops ?? 1)
      case 'rows': {
        const actualTotal = (data.actualRows ?? 0) * (data.actualLoops ?? 1)
        return actualTotal || (data.planRows ?? 0)
      }
      case 'cost':
        return data.exclusiveCost ?? 0
      default:
        return 0
    }
  })()

  const maxForHeat =
    heat.mode === 'time'
      ? heat.maxTime
      : heat.mode === 'rows'
        ? heat.maxRows
        : heat.mode === 'cost'
          ? heat.maxCost
          : 1
  const pct = Math.max(0, Math.min(100, Math.round((valueForHeat / (maxForHeat || 1)) * 100)))
  const heatColor = (() => {
    if (heat.mode === 'none') return 'transparent'
    const hue = 120 - pct * 1.2 // 120->0 (green->red)
    return `hsl(${hue}, 85%, 45%)`
  })()

  return (
    <div
      className="border-[0.5px] overflow-hidden rounded-[4px] shadow-sm"
      style={{ width: DEFAULT_NODE_WIDTH }}
    >
      <Handle type="target" position={Position.Top} className={HIDDEN_NODE_CONNECTOR} />
      <header
        className={cn(
          'text-[0.55rem] pl-2 pr-1 bg-alternative flex items-center justify-between',
          itemHeight
        )}
      >
        <div className="flex gap-x-1 items-center">
          <Workflow strokeWidth={1} size={12} className="text-light" />
          {data.label}
        </div>
      </header>
      {heat.mode !== 'none' && (
        <div className="h-[3px] w-full bg-surface-100">
          <div
            className="h-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: heatColor }}
            title={
              heat.mode === 'time'
                ? `time (self): ${valueForHeat.toFixed(2)} ms`
                : heat.mode === 'rows'
                  ? `rows: ${valueForHeat}`
                  : heat.mode === 'cost'
                    ? `self cost: ${valueForHeat.toFixed(2)}`
                    : undefined
            }
          />
        </div>
      )}
      {headerLines.length > 0 && (
        <div className="px-2 bg-alternative pb-3">
          {headerLines.map((line, i) => (
            <div key={i} className="text-[0.55rem] text-foreground-lighter break-words h-[15px]">
              {line}
            </div>
          ))}
        </div>
      )}

      <ul>
        {/* Time (actual) */}
        {vis.time && data.actualTotalTime !== undefined && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              itemHeight
            )}
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>time</span>
              <span>
                {data.actualTotalTime} ms{data.actualLoops ? ` ×${data.actualLoops}` : ''}
              </span>
            </div>
          </li>
        )}
        {/* Time (self/exclusive) */}
        {vis.time && typeof data.exclusiveTimeMs === 'number' && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              itemHeight
            )}
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>self time</span>
              <span>{data.exclusiveTimeMs} ms</span>
            </div>
          </li>
        )}

        {/* Rows (actual / est) */}
        {vis.rows && (data.actualRows !== undefined || data.planRows !== undefined) && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              itemHeight
            )}
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>Rows</span>
              <span>
                {data.actualRows !== undefined ? data.actualRows : '-'}
                {data.planRows !== undefined ? ` / est ${data.planRows}` : ''}
              </span>
            </div>
          </li>
        )}
        {/* Estimation factor (actual_total / plan_est) */}
        {vis.rows && typeof data.estFactor === 'number' && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              itemHeight
            )}
            title={
              typeof data.estActualTotalRows === 'number' && typeof data.planRows === 'number'
                ? `actual_total_rows: ${data.estActualTotalRows} / plan_rows: ${data.planRows}`
                : undefined
            }
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>estim</span>
              <span>{data.estFactor.toFixed(2)}×</span>
            </div>
          </li>
        )}

        {/* Costs (startup → total) */}
        {vis.cost && (data.startupCost !== undefined || data.totalCost !== undefined) && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              itemHeight
            )}
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>Cost</span>
              <span>
                {data.startupCost !== undefined ? data.startupCost : '-'}
                {data.totalCost !== undefined ? ` → ${data.totalCost}` : ''}
              </span>
            </div>
          </li>
        )}
        {/* Cost (self/exclusive) */}
        {vis.cost && typeof data.exclusiveCost === 'number' && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              itemHeight
            )}
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>Self Cost</span>
              <span>{data.exclusiveCost.toFixed(2)}</span>
            </div>
          </li>
        )}

        {/* Width */}
        {data.planWidth !== undefined && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              itemHeight
            )}
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>Plan Width</span>
              <span>{data.planWidth} bytes</span>
            </div>
          </li>
        )}

        {/* Filters/Removals */}
        {data.rowsRemovedByFilter !== undefined && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              itemHeight
            )}
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>Removed (filter)</span>
              <span>{data.rowsRemovedByFilter}</span>
            </div>
          </li>
        )}
        {data.rowsRemovedByIndexRecheck !== undefined && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              itemHeight
            )}
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>Removed (recheck)</span>
              <span>{data.rowsRemovedByIndexRecheck}</span>
            </div>
          </li>
        )}
        {data.heapFetches !== undefined && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              itemHeight
            )}
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>Heap Fetches</span>
              <span>{data.heapFetches}</span>
            </div>
          </li>
        )}

        {/* BUFFERS */}
        {vis.buffers && hasShared && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              itemHeight
            )}
            title={sharedTooltip()}
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>Shared (self)</span>
              <span>
                h:{data.exSharedHit ?? 0} r:{data.exSharedRead ?? 0} d:{data.exSharedDirtied ?? 0}{' '}
                w:{data.exSharedWritten ?? 0}
              </span>
            </div>
          </li>
        )}
        {vis.buffers && hasTemp && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              itemHeight
            )}
            title={tempTooltip()}
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>Temp (self)</span>
              <span>
                r:{data.exTempRead ?? 0} w:{data.exTempWritten ?? 0}
              </span>
            </div>
          </li>
        )}
        {vis.buffers && hasLocal && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              itemHeight
            )}
            title={localTooltip()}
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>Local (self)</span>
              <span>
                h:{data.exLocalHit ?? 0} r:{data.exLocalRead ?? 0} d:{data.exLocalDirtied ?? 0} w:
                {data.exLocalWritten ?? 0}
              </span>
            </div>
          </li>
        )}

        {/* Output cols (verbose) */}
        {vis.output && Array.isArray(data.outputCols) && data.outputCols.length > 0 && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              'min-h-[22px]'
            )}
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>Output</span>
              <span className="truncate max-w-[95px]" title={data.outputCols.join(', ')}>
                {data.outputCols.join(', ')}
              </span>
            </div>
          </li>
        )}

        {/* I/O times */}
        {vis.buffers && (data.ioReadTime !== undefined || data.ioWriteTime !== undefined) && (
          <li
            className={cn(
              'text-[8px] leading-5 relative flex flex-row justify-items-start',
              'bg-surface-100',
              'border-t',
              'border-t-[0.5px]',
              'hover:bg-scale-500 transition cursor-default',
              itemHeight
            )}
          >
            <div className="gap-[0.24rem] w-full flex mx-2 align-middle items-center justify-between">
              <span>IO</span>
              <span>
                {typeof data.ioReadTime === 'number' ? `r:${data.ioReadTime}ms` : ''}
                {typeof data.ioWriteTime === 'number'
                  ? `${typeof data.ioReadTime === 'number' ? ' ' : ''}w:${data.ioWriteTime}ms`
                  : ''}
              </span>
            </div>
          </li>
        )}
      </ul>
      <Handle type="source" position={Position.Bottom} className={HIDDEN_NODE_CONNECTOR} />
    </div>
  )
}

export const ExplainPlanFlow = ({ json }: ExplainPlanFlowProps) => {
  const { nodes, edges, meta } = useMemo((): { nodes: Node[]; edges: Edge[]; meta?: PlanMeta } => {
    try {
      const parsed = JSON.parse(json) as any
      const root = Array.isArray(parsed) ? parsed[0] : parsed
      const meta: PlanMeta = {
        planningTime:
          typeof root?.['Planning Time'] === 'number' ? root['Planning Time'] : undefined,
        executionTime:
          typeof root?.['Execution Time'] === 'number' ? root['Execution Time'] : undefined,
        jitTotalTime:
          typeof root?.JIT?.Timing?.Total === 'number'
            ? root.JIT.Timing.Total
            : typeof root?.JIT?.['Total Time'] === 'number'
              ? root.JIT['Total Time']
              : undefined,
      }
      const planPart = root?.Plan ? [root] : parsed
      const graph = buildGraphFromPlan(planPart)
      if (!graph.nodes.length) {
        return {
          nodes: [],
          edges: [],
          meta: {
            ...meta,
            errorMessage: 'Invalid EXPLAIN JSON: Plan node not found.',
            errorDetail:
              'Provide output from EXPLAIN (FORMAT JSON) or EXPLAIN (ANALYZE, FORMAT JSON). The root should be an array and its first element must contain a "Plan" object.',
          },
        }
      }
      return {
        nodes: graph.nodes,
        edges: graph.edges,
        meta: { ...meta, subplanRoots: graph.subplanRoots },
      }
    } catch (e: any) {
      return {
        nodes: [],
        edges: [],
        meta: {
          errorMessage: 'Failed to parse JSON',
          errorDetail:
            (e?.message ? e.message : '') + '\nPaste valid JSON from EXPLAIN (FORMAT JSON).',
        },
      }
    }
  }, [json])

  const [metricsVisibility, setMetricsVisibility] = useState<MetricsVisibility>({
    time: true,
    rows: true,
    cost: true,
    buffers: true,
    output: true,
  })

  // Heatmap mode and maxima across nodes
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('none')
  const heatMax = useMemo(() => {
    let maxTime = 0
    let maxRows = 0
    let maxCost = 0
    nodes.forEach((n) => {
      const d = n.data as PlanNodeData
      const t = (d.exclusiveTimeMs ?? 0) || (d.actualTotalTime ?? 0) * (d.actualLoops ?? 1)
      if (t > maxTime) maxTime = t
      const rowsMetric = (d.actualRows ?? 0) * (d.actualLoops ?? 1) || d.planRows || 0
      if (rowsMetric > maxRows) maxRows = rowsMetric
      const c = d.exclusiveCost ?? 0
      if (c > maxCost) maxCost = c
    })
    return { maxTime: maxTime || 1, maxRows: maxRows || 1, maxCost: maxCost || 1 }
  }, [nodes])

  const [selectedNode, setSelectedNode] = useState<PlanNodeData | null>(null)
  const [copiedConditions, setCopiedConditions] = useState(false)
  const [copiedOutputCols, setCopiedOutputCols] = useState(false)
  const [copiedRawJson, setCopiedRawJson] = useState(false)

  const { resolvedTheme } = useTheme()
  const miniMapMaskColor = resolvedTheme?.includes('dark')
    ? 'rgb(17, 19, 24, .8)'
    : 'rgb(237, 237, 237, .8)'

  const nodeTypes = useMemo(
    () => ({
      [NODE_TYPE]: PlanNode,
    }),
    []
  )

  return (
    <div className="w-full h-full border border-green-500 relative">
      {meta?.errorMessage && (
        <div className="absolute inset-0 z-20 flex items-start justify-center mt-10 pointer-events-none">
          <div className="pointer-events-auto border border-red-500/70 bg-foreground-muted/20 backdrop-blur-sm rounded px-3 py-2 max-w-[720px] text-[11px]">
            <div className="font-semibold text-red-600">{meta.errorMessage}</div>
            {meta.errorDetail && (
              <div className="mt-1 whitespace-pre-wrap text-foreground-lighter">
                {meta.errorDetail}
              </div>
            )}
          </div>
        </div>
      )}
      {meta &&
        (meta.planningTime !== undefined ||
          meta.executionTime !== undefined ||
          meta.jitTotalTime !== undefined) && (
          <div className="absolute z-10 top-2 left-2 text-[10px] px-2 py-1 rounded bg-foreground-muted/20 backdrop-blur-sm border">
            <div className="flex gap-3">
              {meta.planningTime !== undefined && <span>planning: {meta.planningTime} ms</span>}
              {meta.executionTime !== undefined && <span>exec: {meta.executionTime} ms</span>}
              {meta.jitTotalTime !== undefined && <span>jit: {meta.jitTotalTime} ms</span>}
            </div>
          </div>
        )}
      {/* Subplan roots overlay panel */}
      {meta?.subplanRoots?.length && (
        <div className="absolute z-10 top-14 left-2 text-[10px] px-2 py-1 rounded bg-foreground-muted/20 backdrop-blur-sm border">
          <div>
            <span className="font-bold">Subplans:</span>{' '}
            {meta.subplanRoots.map((sp, i) => (
              <span key={sp.id}>
                {sp.name}
                {i < (meta.subplanRoots?.length ?? 0) - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="absolute z-10 top-2 right-2 text-[10px] p-2 rounded bg-foreground-muted/20 backdrop-blur-sm border">
        <div className="flex flex-wrap gap-2 items-center">
          <Label className="inline-flex items-center gap-1">
            <Checkbox
              checked={metricsVisibility.time}
              onCheckedChange={(checked) =>
                setMetricsVisibility((v) => ({ ...v, time: Boolean(checked) }))
              }
            />
            <span>time</span>
          </Label>
          <Label className="inline-flex items-center gap-1">
            <Checkbox
              checked={metricsVisibility.rows}
              onCheckedChange={(checked) =>
                setMetricsVisibility((v) => ({ ...v, rows: Boolean(checked) }))
              }
            />
            <span>rows</span>
          </Label>
          <Label className="inline-flex items-center gap-1">
            <Checkbox
              checked={metricsVisibility.cost}
              onCheckedChange={(checked) =>
                setMetricsVisibility((v) => ({ ...v, cost: Boolean(checked) }))
              }
            />
            <span>cost</span>
          </Label>
          <Label className="inline-flex items-center gap-1">
            <Checkbox
              checked={metricsVisibility.buffers}
              onCheckedChange={(checked) =>
                setMetricsVisibility((v) => ({ ...v, buffers: Boolean(checked) }))
              }
            />
            <span>buffers</span>
          </Label>
          <Label className="inline-flex items-center gap-1">
            <Checkbox
              checked={metricsVisibility.output}
              onCheckedChange={(checked) =>
                setMetricsVisibility((v) => ({ ...v, output: Boolean(checked) }))
              }
            />
            <span>output</span>
          </Label>
          <div className="h-[14px] w-px bg-border mx-1" />
          <div className="flex items-center gap-x-1">
            <span>Heatmap:</span>
            <Select value={heatmapMode} onValueChange={(v) => setHeatmapMode(v as HeatmapMode)}>
              <SelectTrigger size="tiny" className="w-20">
                <SelectValue placeholder="none" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="none">none</SelectItem>
                <SelectItem value="time">time</SelectItem>
                <SelectItem value="rows">rows</SelectItem>
                <SelectItem value="cost">cost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {selectedNode && (
        <div className="absolute z-20 top-16 right-2 w-[380px] max-h-[75%] overflow-x-hidden overflow-y-auto rounded border bg-background shadow-lg">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="text-xs font-semibold truncate" title={selectedNode.label}>
              Details: {selectedNode.label}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-6 px-2 py-1"
              onClick={() => setSelectedNode(null)}
            >
              Close
            </Button>
          </div>

          <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(75vh-48px)] text-[11px]">
            {/* Context line */}
            {(selectedNode.relationName || selectedNode.alias) && (
              <div className="text-foreground-lighter">
                {selectedNode.relationName ?? ''}
                {selectedNode.alias ? ` as ${selectedNode.alias}` : ''}
              </div>
            )}

            {/* Conditions */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold">Conditions</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 py-0.5 text-[11px]"
                    onClick={() => {
                      const parts = [
                        selectedNode.hashCond && `Hash Cond: ${selectedNode.hashCond}`,
                        selectedNode.mergeCond && `Merge Cond: ${selectedNode.mergeCond}`,
                        selectedNode.joinFilter && `Join Filter: ${selectedNode.joinFilter}`,
                        selectedNode.indexCond && `Index Cond: ${selectedNode.indexCond}`,
                        selectedNode.recheckCond && `Recheck Cond: ${selectedNode.recheckCond}`,
                        selectedNode.filter && `Filter: ${selectedNode.filter}`,
                      ].filter(Boolean)
                      copyToClipboard(parts.join('\n'), () => {
                        setCopiedConditions(true)
                        setTimeout(() => setCopiedConditions(false), 1200)
                      })
                    }}
                  >
                    {copiedConditions ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Copied
                      </span>
                    ) : (
                      'Copy'
                    )}
                  </Button>
                </div>
              </div>
              <ul className="space-y-1">
                {selectedNode.hashCond && (
                  <li>
                    <span className="text-foreground-lighter">Hash Cond:</span>{' '}
                    {selectedNode.hashCond}
                  </li>
                )}
                {selectedNode.mergeCond && (
                  <li>
                    <span className="text-foreground-lighter">Merge Cond:</span>{' '}
                    {selectedNode.mergeCond}
                  </li>
                )}
                {selectedNode.joinFilter && (
                  <li>
                    <span className="text-foreground-lighter">Join Filter:</span>{' '}
                    {selectedNode.joinFilter}
                  </li>
                )}
                {selectedNode.indexCond && (
                  <li>
                    <span className="text-foreground-lighter">Index Cond:</span>{' '}
                    {selectedNode.indexCond}
                  </li>
                )}
                {selectedNode.recheckCond && (
                  <li>
                    <span className="text-foreground-lighter">Recheck Cond:</span>{' '}
                    {selectedNode.recheckCond}
                  </li>
                )}
                {selectedNode.filter && (
                  <li>
                    <span className="text-foreground-lighter">Filter:</span> {selectedNode.filter}
                  </li>
                )}
                {!(
                  selectedNode.hashCond ||
                  selectedNode.mergeCond ||
                  selectedNode.joinFilter ||
                  selectedNode.indexCond ||
                  selectedNode.recheckCond ||
                  selectedNode.filter
                ) && <li className="text-foreground-lighter">(none)</li>}
              </ul>
            </div>

            {/* Output columns */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold">Output Columns</div>
                {Array.isArray(selectedNode.outputCols) && selectedNode.outputCols.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 py-0.5 text-[11px]"
                    onClick={() =>
                      copyToClipboard(selectedNode.outputCols!.join(', '), () => {
                        setCopiedOutputCols(true)
                        setTimeout(() => setCopiedOutputCols(false), 1200)
                      })
                    }
                  >
                    {copiedOutputCols ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Copied
                      </span>
                    ) : (
                      'Copy'
                    )}
                  </Button>
                )}
              </div>
              {Array.isArray(selectedNode.outputCols) && selectedNode.outputCols.length > 0 ? (
                <div className="p-2 border rounded bg-surface-100 whitespace-pre-wrap break-words">
                  {selectedNode.outputCols.join(', ')}
                </div>
              ) : (
                <div className="text-foreground-lighter">(none)</div>
              )}
            </div>

            {/* Raw JSON */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold">Raw JSON</div>
                {selectedNode.raw && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 py-0.5 text-[11px]"
                    onClick={() =>
                      copyToClipboard(JSON.stringify(selectedNode.raw, null, 2), () => {
                        setCopiedRawJson(true)
                        setTimeout(() => setCopiedRawJson(false), 1200)
                      })
                    }
                  >
                    {copiedRawJson ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Copied
                      </span>
                    ) : (
                      'Copy'
                    )}
                  </Button>
                )}
              </div>
              {selectedNode.raw ? (
                <pre className="p-2 border rounded bg-surface-100 overflow-auto max-h-[240px] text-[10px]">
                  {JSON.stringify(selectedNode.raw, null, 2)}
                </pre>
              ) : (
                <div className="text-foreground-lighter">(no data)</div>
              )}
            </div>
          </div>
        </div>
      )}
      <MetricsVisibilityContext.Provider value={metricsVisibility}>
        <HeatmapContext.Provider
          value={{
            mode: heatmapMode,
            maxTime: heatMax.maxTime,
            maxRows: heatMax.maxRows,
            maxCost: heatMax.maxCost,
          }}
        >
          <ReactFlow
            defaultNodes={[]}
            defaultEdges={[]}
            nodesConnectable={false}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              deletable: false,
              style: {
                stroke: 'hsl(var(--border-stronger))',
                strokeWidth: 1,
              },
            }}
            fitView
            nodeTypes={nodeTypes}
            nodes={nodes}
            edges={edges}
            minZoom={0.8}
            maxZoom={1.8}
            proOptions={{ hideAttribution: true }}
            onInit={(instance) => {
              if (nodes.length > 0) {
                setTimeout(() => instance.fitView({}))
              }
            }}
            onNodeClick={(e, node) => setSelectedNode(node.data as PlanNodeData)}
            onPaneClick={() => setSelectedNode(null)}
          >
            <Background
              gap={16}
              className="[&>*]:stroke-foreground-muted opacity-[25%]"
              variant={BackgroundVariant.Dots}
              color={'inherit'}
            />
            <MiniMap
              pannable
              zoomable
              nodeColor="#111318"
              maskColor={miniMapMaskColor}
              className="border rounded-md shadow-sm"
            />
          </ReactFlow>
        </HeatmapContext.Provider>
      </MetricsVisibilityContext.Provider>
    </div>
  )
}
