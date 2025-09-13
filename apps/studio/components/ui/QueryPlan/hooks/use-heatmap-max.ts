import { useMemo } from 'react'
import type { Node } from 'reactflow'
import type { PlanNodeData } from '../types'

export function useHeatmapMax(nodes: Node<PlanNodeData>[]) {
  return useMemo(() => {
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
}
