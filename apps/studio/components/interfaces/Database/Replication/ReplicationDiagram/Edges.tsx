import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { useParams } from 'common'
import { ArrowRight, Loader2, Square, X, type LucideIcon } from 'lucide-react'
import { useMemo } from 'react'
import { cn } from 'ui'

import { getStatusName } from '../Pipeline.utils'
import { STATUS_REFRESH_FREQUENCY_MS } from '../Replication.constants'
import { REPLICA_STATUS } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
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

interface ReplicationState {
  isComingUp: boolean
  isReplicating: boolean
  isFailed: boolean
}

interface EdgeVisual {
  Icon: LucideIcon
  // CSS color shared by the icon and the connecting line so they always match.
  color: string
  opacity: number
  dashArray: string
  shouldAnimate: boolean
  shouldSpin?: boolean
  isFilled?: boolean
  strokeWidth?: number
}

// Picks the icon + line appearance for a replication state. Both the icon and the line are derived
// here from the same state so they always stay in sync. We deliberately don't surface lag: the line
// just communicates whether data is moving, stopped, starting, or broken.
const getEdgeVisual = ({ isComingUp, isReplicating, isFailed }: ReplicationState): EdgeVisual => {
  if (isFailed) {
    return {
      Icon: X,
      color: 'hsl(var(--destructive-default))',
      opacity: 1,
      dashArray: '5 5',
      shouldAnimate: false,
      strokeWidth: 4,
    }
  }
  if (isComingUp) {
    return {
      Icon: Loader2,
      color: 'hsl(var(--foreground-light))',
      opacity: 1,
      dashArray: '5',
      shouldAnimate: true,
      shouldSpin: true,
    }
  }
  if (isReplicating) {
    return {
      Icon: ArrowRight,
      color: 'hsl(var(--brand-default))',
      opacity: 1,
      dashArray: '5',
      shouldAnimate: true,
    }
  }
  return {
    Icon: Square,
    color: 'hsl(var(--foreground-lighter))',
    opacity: 0.5,
    dashArray: '5 5',
    shouldAnimate: false,
    isFilled: true,
  }
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

  const { Icon, color, opacity, dashArray, shouldAnimate, shouldSpin, isFilled, strokeWidth } =
    getEdgeVisual(replicationState)

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
          style={{
            transform: `translate(-50%, -50%) translate(${shiftEdgeEnd ? targetX - 30 : labelX}px,${shiftEdgeEnd ? targetY : labelY}px)`,
          }}
        >
          <Icon
            size={12}
            strokeWidth={strokeWidth ?? 2}
            fill={isFilled ? 'currentColor' : 'none'}
            className={cn(shouldSpin && 'animate-spin')}
            style={{ color }}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
