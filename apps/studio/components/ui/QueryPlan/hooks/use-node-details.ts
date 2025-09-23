import { useMemo } from 'react'

import type { PlanMeta, PlanNodeData } from '../types'
import { hasLocal, hasShared, hasTemp, removedPercentValue } from '../utils/node-display'
import { formatMs, formatNumber } from '../utils/formats'

export type OverviewMetric = {
  id: string
  label: string
  value: string
  subLabel?: string
}

export type ExecutionMetric = {
  id: string
  label: string
  value: string
  helper?: string
}

export type CostMetric = {
  id: string
  label: string
  value: string
}

export type BufferTotals = {
  exclusive: {
    shared: number
    temp: number
    local: number
    total: number
  }
  inclusive: {
    shared: number
    temp: number
    local: number
    total: number
  }
}

export type ConditionRow = {
  key: string
  label: string
  value?: string
}

export type OutputColumn = string

export type EstimationInsight = {
  badgeText: string
  summary: string
  implication: string
  guidance: string
  severity: 'major' | 'critical'
  variant: 'warning' | 'destructive'
}

export type NodeDetails = {
  overviewMetrics: OverviewMetric[]
  executionMetrics: ExecutionMetric[]
  costMetrics: CostMetric[]
  estimationInsight?: EstimationInsight
  bufferTotals: BufferTotals
  hasSharedBuffers: boolean
  hasTempBuffers: boolean
  hasLocalBuffers: boolean
  hasBufferData: boolean
  hasIOTiming: boolean
  conditionRows: ConditionRow[]
  outputColumns: OutputColumn[]
  filteredPercent?: number
  joinFilteredPercent?: number
  recheckPercent?: number
  slowHint?: PlanNodeData['slowHint']
  costHint?: PlanNodeData['costHint']
  loops: number
  formattedLoops: string
  formattedSelfTime?: string
  formattedSelfCost?: string
  formattedTotalTimePerLoop?: string
  formattedTotalTimeAllLoops?: string
  executionShare?: string
  actualRows?: string
  rowsAcrossLoops?: string
  plannedRowsPerLoop?: string
  plannedRowsAcrossLoops?: string
  estFactor?: string
  estimationDirectionLabel?: string
  hasTimeDetails: boolean
  hasCostDetails: boolean
  hasEstimateDetails: boolean
  costShareSummary?: string
  slowHintShare?: number
  slowHintTimeText?: string
  costHighlightValue?: number
  formattedCostHighlight?: string
  costHintExclusiveShare?: number
  costHintMaxTotalShare?: number
  costHintSummary?: string
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

const formatPercent = (value?: number) => {
  if (value === undefined || Number.isNaN(value)) return undefined
  return `${value.toFixed(1)}%`
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

  if (normalizedFactor < 10) return undefined

  const severity: EstimationInsight['severity'] = normalizedFactor >= 100 ? 'critical' : 'major'
  const variant: EstimationInsight['variant'] = severity === 'critical' ? 'destructive' : 'warning'
  const directionTitle = data.estDirection === 'over' ? 'Over' : 'Under'
  const directionLower = directionTitle.toLowerCase()
  const multiplierText = Number.isFinite(normalizedFactor)
    ? normalizedFactor >= 100
      ? formatNumber(Math.round(normalizedFactor)) ?? `${Math.round(normalizedFactor)}`
      : normalizedFactor.toFixed(1).replace(/\.0$/, '')
    : '∞'

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

  return {
    badgeText: `${directionTitle}estimated ×${multiplierText}`,
    summary: summaryParts.join(' '),
    implication,
    guidance:
      'Make sure table statistics are current (autovacuum or a manual ANALYZE if you have access) and review indexes or predicates so the planner has more reliable estimates.',
    severity,
    variant,
  }
}

export const useNodeDetails = (data: PlanNodeData, meta?: PlanMeta): NodeDetails => {
  return useMemo(() => {
    const loops = data.actualLoops ?? 1
    const formattedLoops = formatNumber(loops) ?? `${loops}`
    const totalTimePerLoop = data.actualTotalTime
    const totalTimeAllLoops = loops > 1 && totalTimePerLoop ? totalTimePerLoop * loops : undefined
    const formattedTotalTimePerLoop = formatMs(totalTimePerLoop)
    const formattedTotalTimeAllLoops = totalTimeAllLoops ? formatMs(totalTimeAllLoops) : undefined
    const formattedSelfTime = formatMs(data.exclusiveTimeMs)
    const formattedSelfCost =
      data.exclusiveCost !== undefined ? data.exclusiveCost.toFixed(2) : undefined
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

    const costHint = data.costHint
    const slowHint = data.slowHint
    const slowHintShare = slowHint ? Math.round(slowHint.selfTimeShare * 100) : undefined
    const slowHintTimeText = slowHint
      ? formatMs(slowHint.selfTimeMs) ?? slowHint.selfTimeMs.toFixed(2)
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
    const costShareSummary = costShareDetails.length > 0 ? costShareDetails.join('; ') : undefined
    const costHintSummary =
      costHintMaxTotalShare !== undefined && costHintMaxTotalShare >= (costHintExclusiveShare ?? -1)
        ? ` (~${costHintMaxTotalShare}% of the plan's highest total cost).`
        : costHintExclusiveShare !== undefined
          ? ` (~${costHintExclusiveShare}% of exclusive plan cost).`
          : '.'

    const overviewMetrics: OverviewMetric[] = [
      {
        id: 'self-time',
        label: 'Self time',
        value: formattedSelfTime ? `${formattedSelfTime} ms` : '—',
        subLabel: executionShare ? `${executionShare} of total execution` : undefined,
      },
      {
        id: 'self-cost',
        label: 'Self cost',
        value: formattedSelfCost ?? '—',
        subLabel: costShareSummary,
      },
      {
        id: 'loops',
        label: 'Loops',
        value: formattedLoops,
      },
      {
        id: 'rows-seen',
        label: 'Rows seen',
        value: actualRows ?? '—',
        subLabel: rowsAcrossLoops ? `All loops combined ${rowsAcrossLoops}` : undefined,
      },
    ]

    const executionMetrics: ExecutionMetric[] = [
      {
        id: 'total-time-per-loop',
        label: 'Total time (per loop)',
        value: formattedTotalTimePerLoop ? `${formattedTotalTimePerLoop} ms` : '—',
      },
    ]

    if (formattedTotalTimeAllLoops) {
      executionMetrics.push({
        id: 'total-time-all-loops',
        label: 'All loops combined',
        value: `${formattedTotalTimeAllLoops} ms`,
      })
    }

    executionMetrics.push(
      {
        id: 'self-time-detail',
        label: 'Self time',
        value: formattedSelfTime ? `${formattedSelfTime} ms` : '—',
        helper: executionShare ? `(${executionShare})` : undefined,
      },
      {
        id: 'loops-observed',
        label: 'Loops observed',
        value: formattedLoops,
      }
    )

    if (rowsAcrossLoops) {
      executionMetrics.push({
        id: 'rows-across-loops',
        label: 'Rows across loops',
        value: rowsAcrossLoops,
      })
    }

    const costMetrics: CostMetric[] = [
      {
        id: 'startup-cost',
        label: 'Startup cost',
        value: data.startupCost !== undefined ? data.startupCost.toFixed(2) : '—',
      },
      {
        id: 'total-cost',
        label: 'Total cost',
        value: data.totalCost !== undefined ? data.totalCost.toFixed(2) : '—',
      },
      {
        id: 'self-cost-detail',
        label: 'Self cost',
        value: data.exclusiveCost !== undefined ? data.exclusiveCost.toFixed(2) : '—',
      },
    ]

    const exclusiveBuffers = exclusiveBufferTotal(data)
    const inclusiveBuffers = inclusiveBufferTotal(data)

    const filteredPercent = removedPercentValue(data, data.rowsRemovedByFilter)
    const joinFilteredPercent = removedPercentValue(data, data.rowsRemovedByJoinFilter)
    const recheckPercent = removedPercentValue(data, data.rowsRemovedByIndexRecheck)

    const conditionRows: ConditionRow[] = [
      { key: 'filter', label: 'Filter', value: data.filter },
      { key: 'hash-cond', label: 'Hash condition', value: data.hashCond },
      { key: 'index-cond', label: 'Index recheck', value: data.recheckCond },
      { key: 'join-filter', label: 'Join filter', value: data.joinFilter },
      { key: 'merge-cond', label: 'Merge condition', value: data.mergeCond },
      { key: 'index', label: 'Index condition', value: data.indexCond },
    ]

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

    return {
      overviewMetrics,
      executionMetrics,
      costMetrics,
      estimationInsight: computeEstimationInsight(data),
      bufferTotals: {
        exclusive: exclusiveBuffers,
        inclusive: inclusiveBuffers,
      },
      hasSharedBuffers: hasShared(data),
      hasTempBuffers: hasTemp(data),
      hasLocalBuffers: hasLocal(data),
      hasBufferData: hasShared(data) || hasTemp(data) || hasLocal(data),
      hasIOTiming: (data.ioReadTime ?? 0) + (data.ioWriteTime ?? 0) > 0,
      conditionRows,
      outputColumns: data.outputCols ?? [],
      filteredPercent,
      joinFilteredPercent,
      recheckPercent,
      slowHint,
      costHint,
      loops,
      formattedLoops,
      formattedSelfTime,
      formattedSelfCost,
      formattedTotalTimePerLoop,
      formattedTotalTimeAllLoops,
      executionShare,
      actualRows,
      rowsAcrossLoops,
      plannedRowsPerLoop,
      plannedRowsAcrossLoops,
      estFactor,
      estimationDirectionLabel,
      hasTimeDetails,
      hasCostDetails,
      hasEstimateDetails,
      costShareSummary,
      slowHintShare,
      slowHintTimeText,
      costHighlightValue,
      formattedCostHighlight,
      costHintExclusiveShare,
      costHintMaxTotalShare,
      costHintSummary,
    }
  }, [data, meta])
}
