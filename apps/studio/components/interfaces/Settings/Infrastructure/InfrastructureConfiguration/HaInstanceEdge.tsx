import { BaseEdge, type EdgeProps } from '@xyflow/react'

const EDGE_GUTTER = 28
const CORNER_RADIUS = 8
/** Turns soon after leaving the gateway so the corner sits above the primary row. */
const FAILOVER_DIVERGE_OFFSET = 48

/** Routes failover traffic sideways before descending, avoiding the primary card. */
export const HaFailoverEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
}: EdgeProps) => {
  const direction = targetX < sourceX ? -1 : 1
  const routeX = targetX + direction * EDGE_GUTTER
  const sourceTurnY = Math.min(sourceY + FAILOVER_DIVERGE_OFFSET, targetY - EDGE_GUTTER * 2)
  const targetTurnY = targetY - EDGE_GUTTER
  const radius = Math.min(
    CORNER_RADIUS,
    EDGE_GUTTER / 2,
    Math.max(0, (targetTurnY - sourceTurnY) / 2)
  )

  const edgePath = [
    `M ${sourceX} ${sourceY}`,
    `L ${sourceX} ${sourceTurnY - radius}`,
    `Q ${sourceX} ${sourceTurnY} ${sourceX + direction * radius} ${sourceTurnY}`,
    `L ${routeX - direction * radius} ${sourceTurnY}`,
    `Q ${routeX} ${sourceTurnY} ${routeX} ${sourceTurnY + radius}`,
    `L ${routeX} ${targetTurnY - radius}`,
    `Q ${routeX} ${targetTurnY} ${routeX - direction * radius} ${targetTurnY}`,
    `L ${targetX + direction * radius} ${targetTurnY}`,
    `Q ${targetX} ${targetTurnY} ${targetX} ${targetTurnY + radius}`,
    `L ${targetX} ${targetY}`,
  ].join(' ')

  return <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
}
