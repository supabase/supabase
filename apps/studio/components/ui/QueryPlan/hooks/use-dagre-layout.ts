import { useMemo } from 'react'
import type { Edge, Node } from 'reactflow'

import type { PlanNodeData } from '../types'
import type { MetricsVisibility, HeatmapMode } from '../contexts'
import { getNodesWithPositionsViaDagre } from '../utils/layout'
import { estimateNodeHeight } from '../utils/node-display'
import { DEFAULT_NODE_WIDTH } from '../constants'

export function useDagreLayout(
  nodes: Node<PlanNodeData>[],
  edges: Edge[],
  metricsVisibility: MetricsVisibility,
  heatmapMode: HeatmapMode
) {
  return useMemo(() => {
    if (!nodes.length) return { nodes: [], edges: [] }

    const sizes: Record<string, { width: number; height: number }> = {}
    nodes.forEach((n) => {
      const data = n.data
      const height = estimateNodeHeight(data, metricsVisibility, heatmapMode)
      sizes[n.id] = { width: DEFAULT_NODE_WIDTH, height }
    })

    const { nodes: nl, edges: el } = getNodesWithPositionsViaDagre(
      nodes.map((n) => ({ ...n })),
      edges.map((e) => ({ ...e })),
      sizes
    )

    return { nodes: nl, edges: el }
  }, [nodes, edges, metricsVisibility, heatmapMode])
}
