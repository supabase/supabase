import type { Edge, Node } from 'reactflow'
import { useMemo } from 'react'

import type { PlanMeta, PlanNodeData, PlanRoot } from '../types'
import { buildGraphFromPlan } from '../graph/build-graph-from-plan'

export function usePlanGraph(json: string): {
  nodes: Node<PlanNodeData>[]
  edges: Edge[]
  meta?: PlanMeta
} {
  return useMemo(() => {
    try {
      const parsed = JSON.parse(json) as PlanRoot[]
      const root = parsed[0]

      const meta: PlanMeta = {
        planningTime: root['Planning Time'],
        executionTime: root['Execution Time'],
        jitTotalTime: root.JIT?.Timing?.Total,
      }

      const graph = buildGraphFromPlan(root, {
        executionTime: meta.executionTime,
      })

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
    } catch (e: unknown) {
      return {
        nodes: [],
        edges: [],
        meta: {
          errorMessage: 'Failed to parse JSON',
          errorDetail: (e as Error)?.message
            ? `${(e as Error).message}\nPaste valid JSON from EXPLAIN (FORMAT JSON).`
            : 'Paste valid JSON from EXPLAIN (FORMAT JSON).',
        },
      }
    }
  }, [json])
}
