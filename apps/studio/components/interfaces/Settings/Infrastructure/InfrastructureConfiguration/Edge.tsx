import { Loader2 } from 'lucide-react'
import type { EdgeProps } from 'reactflow'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from 'reactflow'

import { useParams } from 'common'
import { useReplicationLagQuery } from 'data/read-replicas/replica-lag-query'
import { formatDatabaseID } from 'data/read-replicas/replicas.utils'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { REPLICA_STATUS } from './InstanceConfiguration.constants'

export const SmoothstepEdge = ({
  id,
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
  // [Joshen] Only applicable for replicas
  const { status, identifier, connectionString } = data || {}
  const formattedId = formatDatabaseID(identifier ?? '')

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
    isLoading,
    isError,
  } = useReplicationLagQuery(
    {
      id: identifier,
      projectRef: ref,
      connectionString,
    },
    { enabled: status === REPLICA_STATUS.ACTIVE_HEALTHY }
  )
  const lagValue = Number(lagDuration?.toFixed(2) ?? 0).toLocaleString()

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {data !== undefined && !isError && status === REPLICA_STATUS.ACTIVE_HEALTHY && (
        <EdgeLabelRenderer>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="bg-surface-100 px-1.5 py-0.5 rounded absolute nodrag nopan"
                style={{
                  transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                  pointerEvents: 'all',
                }}
              >
                {isLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <p className="font-mono text-xs">{lagValue}s</p>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center">
              {isLoading
                ? `Checking replication lag for replica ID: ${formattedId}`
                : `Replication lag (seconds) for replica ID: ${formattedId}`}
            </TooltipContent>
          </Tooltip>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
