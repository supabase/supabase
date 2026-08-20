import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { useParams } from 'common'
import { useMemo } from 'react'

import { getStatusName } from '../Pipeline.utils'
import { REPLICA_STATUS, STATUS_REFRESH_FREQUENCY_MS } from '../Replication.constants'
import {
  EdgeVisualIcon,
  getEdgeVisual,
  type ReplicationState,
} from '@/components/ui/ReactFlow/EdgeVisual'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
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
  const { type, identifier, shiftEdgeEnd } = (data || {}) as EdgeData
  const isReplica = type === 'replica'

  // Subscribe to the same live status the nodes use, so the line and the node update together.
  const { data: databases = [] } = useReadReplicasQuery(
    { projectRef },
    { enabled: isReplica, refetchInterval: STATUS_REFRESH_FREQUENCY_MS }
  )
  const replica = databases.find((x) => x.identifier === identifier)

  const { data: pipelinesData } = useReplicationPipelinesQuery(
    { projectRef },
    { enabled: !isReplica }
  )
  const pipeline = (pipelinesData?.pipelines ?? []).find(
    (p) => p.destination_id.toString() === identifier
  )
  const { data: pipelineStatusData } = useReplicationPipelineStatusQuery(
    { projectRef, pipelineId: pipeline?.id },
    { enabled: !isReplica && !!pipeline?.id, refetchInterval: STATUS_REFRESH_FREQUENCY_MS }
  )
  const { getRequestStatus } = usePipelineRequestStatus()
  const requestStatus = pipeline?.id
    ? getRequestStatus(pipeline.id)
    : PipelineStatusRequestStatus.None

  const replicationState = useMemo<ReplicationState>(() => {
    if (isReplica) {
      const status = replica?.status
      return {
        isReplicating: status === 'ACTIVE_HEALTHY',
        isComingUp:
          status !== undefined &&
          [
            REPLICA_STATUS.COMING_UP,
            REPLICA_STATUS.INIT_READ_REPLICA,
            REPLICA_STATUS.UNKNOWN,
          ].includes(status),
        isFailed:
          status !== undefined &&
          [REPLICA_STATUS.ACTIVE_UNHEALTHY, REPLICA_STATUS.INIT_FAILED].includes(status),
      }
    }
    const isTransitioning = requestStatus !== PipelineStatusRequestStatus.None
    const statusName = getStatusName(pipelineStatusData?.status)
    return {
      isReplicating: statusName === 'started' && !isTransitioning,
      isComingUp: isTransitioning || statusName === 'starting' || statusName === 'stopping',
      isFailed: statusName === 'failed',
    }
  }, [isReplica, replica?.status, pipelineStatusData?.status, requestStatus])

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
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
          opacity: visual.opacity,
          strokeDasharray: visual.dashArray,
          animation: visual.shouldAnimate ? 'dashdraw 0.5s linear infinite' : undefined,
        }}
      />

      <EdgeLabelRenderer>
        <div
          className="bg-surface-100 p-1 rounded-sm absolute nodrag nopan border"
          style={{
            transform: `translate(-50%, -50%) translate(${shiftEdgeEnd ? targetX - 30 : labelX}px,${shiftEdgeEnd ? targetY : labelY}px)`,
          }}
        >
          <EdgeVisualIcon visual={visual} />
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
