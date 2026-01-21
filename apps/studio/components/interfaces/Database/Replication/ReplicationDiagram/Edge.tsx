import type { EdgeProps } from 'reactflow'
import { BaseEdge, getSmoothStepPath } from 'reactflow'

export const SmoothstepEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
}
