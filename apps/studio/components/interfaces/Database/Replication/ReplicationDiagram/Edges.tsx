import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { useParams } from 'common'
import { Loader2, X } from 'lucide-react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { useReplicationLagQuery } from '@/data/read-replicas/replica-lag-query'
import { formatDatabaseID } from '@/data/read-replicas/replicas.utils'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

type EdgeData = {
  type: string
  identifier: string
  isComingUp: boolean
  isReplicating: boolean
  isFailed: boolean
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
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { type, identifier, isComingUp, isReplicating, isFailed, shiftEdgeEnd } = (data ||
    {}) as EdgeData
  const formattedId = type === 'replica' ? formatDatabaseID(identifier ?? '') : identifier

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const {
    data: lagDuration,
    isPending: isLoading,
    isError,
  } = useReplicationLagQuery(
    {
      id: identifier,
      projectRef: ref,
      connectionString: project?.connectionString,
    },
    { enabled: type === 'replica' && isReplicating, refetchInterval: 10000 }
  )
  const lagValue = Number(lagDuration?.toFixed(2) ?? 0).toLocaleString()
  const hasReplicationLagData = data !== undefined && !isError && isReplicating

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />

      {isFailed && (
        <EdgeLabelRenderer>
          <div
            className={cn('bg-surface-100 p-1 rounded absolute nodrag nopan border')}
            style={{
              transform: `translate(-50%, -50%) translate(${targetX - 30}px,${targetY}px)`,
            }}
          >
            <X size={12} strokeWidth={4} className="text-destructive" />
          </div>
        </EdgeLabelRenderer>
      )}

      {(isComingUp || hasReplicationLagData) && (
        <EdgeLabelRenderer>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'bg-surface-100 py-1 rounded absolute nodrag nopan border',
                  isLoading || isComingUp ? 'px-1' : 'px-1.5'
                )}
                style={{
                  transform: `translate(-50%, -50%) translate(${shiftEdgeEnd ? targetX - 30 : labelX}px,${shiftEdgeEnd ? targetY : labelY}px)`,
                  pointerEvents: 'all',
                }}
              >
                {isLoading || isComingUp ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <p className="font-mono text-xs">{lagValue}s</p>
                )}
              </div>
            </TooltipTrigger>
            {!isComingUp && (
              <TooltipContent side="bottom" align="center">
                {isLoading
                  ? `Checking replication lag for replica ID: ${formattedId}`
                  : `Replication lag (seconds) for replica ID: ${formattedId}`}
              </TooltipContent>
            )}
          </Tooltip>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
