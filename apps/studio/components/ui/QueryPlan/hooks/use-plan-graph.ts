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
              'The EXPLAIN (FORMAT JSON) result was invalid. The root should be an array and its first element must contain a "Plan" object.',
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
          errorMessage: 'Failed to parse EXPLAIN JSON',
          errorDetail: (e as Error)?.message
            ? `${(e as Error).message}\nThe EXPLAIN (FORMAT JSON) result was not valid JSON.`
            : 'The EXPLAIN (FORMAT JSON) result was not valid JSON.',
        },
      }
    }
  }, [json])
}
