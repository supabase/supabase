import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type Edge,
  type EdgeProps,
} from '@xyflow/react'
import { useParams, useReducedMotion } from 'common'
import { useMemo } from 'react'

import { getStatusName } from '../Pipeline.utils'
import {
  EdgeVisualChip,
  getEdgeVisual,
  type ReplicationState,
} from '@/components/ui/ReactFlow/EdgeVisual'
import { RegionFlag } from '@/components/ui/RegionFlag'
import type { ReplicationRegion } from '@/data/replication/clusters-query'
import { useReplicationPipelineStatusQuery } from '@/data/replication/pipeline-status-query'
import { useReplicationPipelinesQuery } from '@/data/replication/pipelines-query'
import { ReplicationClusterProvider, useReplicationClusterId } from '@/state/replication-cluster'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'

type EdgeData = {
  destinationId: number
  clusterId: string | undefined
  region?: ReplicationRegion
  shiftEdgeEnd: boolean
}

type ReplicationEdgeProps = EdgeProps<Edge<EdgeData, 'smoothstep'>>

export const SmoothstepEdge = (props: ReplicationEdgeProps) => {
  if (!props.data) return null

  return (
    <ReplicationClusterProvider clusterId={props.data.clusterId}>
      <ScopedSmoothstepEdge {...props} data={props.data} />
    </ReplicationClusterProvider>
  )
}

const ScopedSmoothstepEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: ReplicationEdgeProps & { data: EdgeData }) => {
  const { ref: projectRef = 'default' } = useParams()
  const clusterId = useReplicationClusterId()
  const prefersReducedMotion = useReducedMotion()
  const { destinationId, region, shiftEdgeEnd } = data

  const { data: pipelinesData } = useReplicationPipelinesQuery({ projectRef, clusterId })
  const pipeline = pipelinesData?.pipelines.find((p) => p.destination_id === destinationId)
  const { data: pipelineStatusData } = useReplicationPipelineStatusQuery(
    { projectRef, clusterId, pipelineId: pipeline?.id },
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
          <EdgeVisualChip visual={visual} />
          {region && (
            <div className="absolute top-full left-1/2 mt-1 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap text-xs text-foreground-light">
              <span>Pipeline region:</span>
              {region.region_code && <RegionFlag className="w-4" region={region.region_code} />}
              <span>{region.region_name}</span>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
