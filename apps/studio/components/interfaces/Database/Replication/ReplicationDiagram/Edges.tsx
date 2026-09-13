import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { useParams, useReducedMotion } from 'common'
import { useMemo } from 'react'

import { getStatusName } from '../Pipeline.utils'
import { STATUS_REFRESH_FREQUENCY_MS } from '../Replication.constants'
import {
  EdgeVisualChip,
  getEdgeVisual,
  type ReplicationState,
} from '@/components/ui/ReactFlow/EdgeVisual'
import { useReplicationPipelineStatusQuery } from '@/data/replication/pipeline-status-query'
import { useReplicationPipelinesQuery } from '@/data/replication/pipelines-query'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'

type EdgeData = {
  type: string
  identifier: string
  shiftEdgeEnd: boolean
}

export const SmoothstepEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const { ref: projectRef = 'default' } = useParams()
  const prefersReducedMotion = useReducedMotion()
  const { identifier, shiftEdgeEnd } = (data || {}) as EdgeData

  const { data: pipelinesData } = useReplicationPipelinesQuery({ projectRef })
  const pipeline = (pipelinesData?.pipelines ?? []).find(
    (p) => p.destination_id.toString() === identifier
  )
  const { data: pipelineStatusData } = useReplicationPipelineStatusQuery(
    { projectRef, pipelineId: pipeline?.id },
    { enabled: !!pipeline?.id, refetchInterval: STATUS_REFRESH_FREQUENCY_MS }
  )
  const { getRequestStatus } = usePipelineRequestStatus()
  const requestStatus = pipeline?.id
    ? getRequestStatus(pipeline.id)
    : PipelineStatusRequestStatus.None

  const replicationState = useMemo<ReplicationState>(() => {
    const isTransitioning = requestStatus !== PipelineStatusRequestStatus.None
    const statusName = getStatusName(pipelineStatusData?.status)
    return {
      isReplicating: statusName === 'started' && !isTransitioning,
      isComingUp: isTransitioning || statusName === 'starting' || statusName === 'stopping',
      isFailed: statusName === 'failed',
    }
  }, [pipelineStatusData?.status, requestStatus])

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX: shiftEdgeEnd ? targetX - 8 : targetX,
    targetY,
    targetPosition,
  })

  const visual = getEdgeVisual(replicationState)

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: visual.color,
          strokeWidth: visual.strokeWidth,
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
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <EdgeVisualChip visual={visual} />
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
