import { BaseEdge, Edge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { cn } from 'ui'

import { HaReplicationEdgeData } from './HaInstanceConfiguration.utils'
import { getPoolerEdgeState, getPoolerStatus } from './HaTopology.utils'
import { useHaPooler } from './useHaPooler'
import { getEdgeVisual } from '@/components/ui/ReactFlow/getEdgeVisual'

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

  // Until the pooler's state is known, render the edge as coming up.
  const status = pooler !== undefined ? getPoolerStatus(pooler) : 'coming_up'
  const {
    Icon,
    color,
    opacity,
    dashArray,
    shouldAnimate,
    shouldSpin,
    isFilled,
    strokeWidth,
    isDirectional,
  } = getEdgeVisual(getPoolerEdgeState(status))

  // The icon chip sits on the horizontal run of this top-to-bottom smoothstep
  // edge, so point directional icons along the actual flow: toward the
  // target's side, or straight down when the replica sits directly below.
  const dx = targetX - sourceX
  const rotation = Math.abs(dx) < 8 ? 90 : dx > 0 ? 0 : 180

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
          stroke: color,
          opacity,
          strokeDasharray: dashArray,
          animation: shouldAnimate ? 'dashdraw 0.5s linear infinite' : undefined,
        }}
      />

      <EdgeLabelRenderer>
        <div
          className="bg-surface-100 p-1 rounded-sm absolute nodrag nopan border"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
        >
          <Icon
            size={12}
            strokeWidth={strokeWidth ?? 2}
            fill={isFilled ? 'currentColor' : 'none'}
            className={cn(shouldSpin && 'animate-spin')}
            style={{ color, transform: isDirectional ? `rotate(${rotation}deg)` : undefined }}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
