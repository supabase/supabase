import type { Node } from 'reactflow'
import type { PlanNodeData } from '../types'
import { useMemo } from 'react'

export function useHeatmapMax(nodes: Node<PlanNodeData>[]) {
  return useMemo(() => {
    let maxTime = 0
    let maxRows = 0
    let maxCost = 0

    nodes.forEach((n) => {
      const data = n.data

      const time = data.exclusiveTimeMs ?? (data.actualTotalTime ?? 0) * (data.actualLoops ?? 1)
      if (time > maxTime) maxTime = time

      const rowsMetric = (data.actualRows ?? 0) * (data.actualLoops ?? 1) || data.planRows || 0
      if (rowsMetric > maxRows) maxRows = rowsMetric

      const cost = data.exclusiveCost || 0
      if (cost > maxCost) maxCost = cost
    })

    return { maxTime, maxRows, maxCost }
  }, [nodes])
}
