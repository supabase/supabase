import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { useParams, useReducedMotion } from 'common'
import { useMemo } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { PIPELINE_REGION } from '../DestinationPanel/DestinationForm/PipelineRegionField'
import { getStatusName } from '../Pipeline.utils'
import {
  EdgeVisualChip,
  getEdgeVisual,
  type ReplicationState,
} from '@/components/ui/ReactFlow/EdgeVisual'
import { RegionFlag } from '@/components/ui/RegionFlag'
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

  const replicationState = useMemo<ReplicationState>(() => {
    const isTransitioning = requestStatus !== PipelineStatusRequestStatus.None
    const statusName = getStatusName(pipelineStatusData?.status)
    return {
      isReplicating: statusName === 'started' && !isTransitioning,
      isComingUp: isTransitioning || statusName === 'starting' || statusName === 'stopping',
      isFailed: statusName === 'failed',
    }
  }, [pipelineStatusData?.status, requestStatus])

  const edgeTargetX = shiftEdgeEnd ? targetX - 8 : targetX
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX: edgeTargetX,
    targetY,
    targetPosition,
  })
  // Branched paths label their shared vertical bend, so move the chip onto each final segment.
  const chipX = shiftEdgeEnd ? (labelX + edgeTargetX) / 2 : labelX
  const chipY = shiftEdgeEnd ? targetY : labelY

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
            transform: `translate(-50%, -50%) translate(${chipX}px,${chipY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="relative">
            <EdgeVisualChip visual={visual} />
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute left-1/2 top-full mt-1.5 flex -translate-x-1/2 flex-col items-center gap-1 whitespace-nowrap rounded-md border bg-surface-100 px-3 py-2 text-xs">
                  <span className="text-foreground-light">Pipeline region</span>
                  <span className="flex items-center gap-1.5 font-mono">
                    <RegionFlag className="w-4" region={PIPELINE_REGION.code} />
                    {PIPELINE_REGION.code}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>{PIPELINE_REGION.displayName}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
