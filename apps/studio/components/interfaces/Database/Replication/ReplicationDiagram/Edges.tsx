import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { useParams, useReducedMotion } from 'common'
import { cn } from 'ui'

import { PIPELINE_REGION } from '../DestinationPanel/DestinationForm/PipelineRegionField'
import { getPipelineDisplayState, getStatusName } from '../Pipeline.utils'
import { ReplicationRegionLabel } from '../ReplicationRegionLabel'
import { getEdgeVisual } from '@/components/ui/ReactFlow/EdgeVisual'
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
    { enabled: !!pipeline?.id }
  )
  const { getRequestStatus } = usePipelineRequestStatus()
  const requestStatus = pipeline?.id
    ? getRequestStatus(pipeline.id)
    : PipelineStatusRequestStatus.None

  const statusName = getStatusName(pipelineStatusData?.status)
  const displayState = getPipelineDisplayState(requestStatus, statusName)
  const replicationState = {
    isReplicating: displayState.type === 'success',
    isComingUp: displayState.type === 'loading',
    isFailed: displayState.type === 'failure',
  }

  const edgeTargetX = shiftEdgeEnd ? targetX - 8 : targetX
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX: edgeTargetX,
    targetY,
    targetPosition,
  })
  // Center each pipeline box in the space between source and destination.
  const chipX = shiftEdgeEnd ? (sourceX + edgeTargetX) / 2 : labelX
  const chipY = shiftEdgeEnd ? targetY : labelY

  const visual = getEdgeVisual(replicationState)
  const StatusIcon = visual.Icon

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
            transform: `translate(-50%, -50%) translate(${chipX}px,${chipY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="w-52 space-y-2 rounded-md border bg-surface-100 p-3 text-xs">
            <p className="text-xs uppercase tracking-wide text-foreground-lighter">Pipeline</p>
            <div className="flex items-center gap-1.5 text-foreground-light">
              <StatusIcon
                size={14}
                className={cn('shrink-0', visual.shouldSpin && 'motion-safe:animate-spin')}
                style={{ color: visual.color, fill: visual.isFilled ? visual.color : undefined }}
              />
              <span>{displayState.label}</span>
            </div>
            <div className="border-t pt-2">
              <ReplicationRegionLabel code={PIPELINE_REGION.code} className="text-sm" />
            </div>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
