import { BaseEdge, Edge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { useReducedMotion } from 'common'

import { HaReplicationEdgeData } from './HaInstanceConfiguration.utils'
import { getPoolerEdgeState, getPoolerStatus } from './HaTopology.utils'
import { useHaPooler } from './useHaPooler'
import { EdgeVisualIcon, getEdgeVisual } from '@/components/ui/ReactFlow/EdgeVisual'

// The icon chip sits on the horizontal run of this top-to-bottom smoothstep
// edge, so directional icons point along the actual flow: toward the target's
// side, or straight down when the replica sits directly below the primary.
const getIconRotation = (dx: number) => {
  if (Math.abs(dx) < 8) return 90
  return dx > 0 ? 0 : 180
}

export const HaReplicationEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps<Edge<HaReplicationEdgeData>>) => {
  const { cell, name } = data ?? {}
  const { data: pooler } = useHaPooler({ cell, name })
  const prefersReducedMotion = useReducedMotion()

  // Until the pooler's state is known, render the edge as coming up.
  const status = pooler !== undefined ? getPoolerStatus(pooler) : 'coming_up'
  const visual = getEdgeVisual(getPoolerEdgeState(status))

  const rotation = getIconRotation(targetX - sourceX)

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: visual.color,
          opacity: visual.opacity,
          strokeDasharray: visual.dashArray,
          animation:
            visual.shouldAnimate && !prefersReducedMotion
              ? 'dashdraw 0.5s linear infinite'
              : undefined,
        }}
      />

      <EdgeLabelRenderer>
        <div
          className="bg-surface-100 p-1 rounded-sm absolute nodrag nopan border"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
        >
          <EdgeVisualIcon visual={visual} rotation={rotation} />
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
