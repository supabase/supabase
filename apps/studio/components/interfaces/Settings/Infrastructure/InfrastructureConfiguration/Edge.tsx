import { BaseEdge, Edge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import { useParams } from 'common'
import { Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { EdgeData, REPLICA_STATUS } from './InstanceConfiguration.constants'
import { useReplicationLagQuery } from '@/data/read-replicas/replica-lag-query'
import { formatDatabaseID } from '@/data/read-replicas/replicas.utils'

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
}: EdgeProps<Edge<EdgeData>>) => {
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
    isPending: isLoading,
    isError,
  } = useReplicationLagQuery(
    {
      // Safe cast as the query isn't enable if identifier is null/undefined
      id: identifier as string,
      projectRef: ref,
      connectionString,
    },
    { enabled: identifier != null && status === REPLICA_STATUS.ACTIVE_HEALTHY }
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
                className="bg-surface-100 px-1.5 py-0.5 rounded-sm absolute nodrag nopan"
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
