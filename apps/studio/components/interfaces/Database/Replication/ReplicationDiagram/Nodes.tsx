import { PropsWithChildren, useMemo } from 'react'
import { Handle, Position } from 'reactflow'

import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { formatDatabaseID } from '@/data/read-replicas/replicas.utils'
import { useReplicationDestinationsQuery } from '@/data/replication/destinations-query'
import { useReplicationPipelineStatusQuery } from '@/data/replication/pipeline-status-query'
import { useReplicationPipelinesQuery } from '@/data/replication/pipelines-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { BASE_PATH } from '@/lib/constants'
import { useParams } from 'common'
import { AnalyticsBucket, BigQuery, Database } from 'icons'
import { AWS_REGIONS } from 'shared-data'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { getStatusName } from '../Pipeline.utils'
import { getStatusLabel } from '../ReadReplicas/ReadReplicas.utils'
import { STATUS_REFRESH_FREQUENCY_MS } from '../Replication.constants'

export const NODE_WIDTH = 480

const NodeContainer = ({ className, children }: PropsWithChildren<{ className?: string }>) => {
  return (
    <div
      style={{ width: NODE_WIDTH / 2 + 55 }}
      className={cn(
        'flex items-start justify-between p-3 rounded bg-surface-100 border border-default',
        className
      )}
    >
      {children}
    </div>
  )
}

export const PrimaryDatabaseNode = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { data: databases = [] } = useReadReplicasQuery({ projectRef })
  const hasReadReplicas = databases.some((x) => x.identifier !== projectRef)

  const { data: destinationsData } = useReplicationDestinationsQuery({ projectRef })
  const hasDestinations = (destinationsData?.destinations ?? []).length > 0

  const regionLabel = Object.values(AWS_REGIONS).find(
    (x) => x.code === project?.region
  )?.displayName
  const hasReplication = hasReadReplicas || hasDestinations

  return (
    <NodeContainer>
      <div className="flex flex-col gap-y-0.5">
        <p className="text-sm">Primary Database</p>
        <p className="text-sm text-foreground-light">
          {project?.cloud_provider} • {regionLabel}
        </p>
      </div>
      {!!project && (
        <img
          alt="region icon"
          className="w-8 rounded-sm mt-0.5"
          src={`${BASE_PATH}/img/regions/${project?.region}.svg`}
        />
      )}
      {hasReplication && <Handle type="source" position={Position.Right} className="opacity-25" />}
    </NodeContainer>
  )
}

export const ReplicationNode = ({ id }: { id: string }) => {
  const { ref: projectRef } = useParams()

  const { data: destinationsData } = useReplicationDestinationsQuery({ projectRef })
  const destination = (destinationsData?.destinations ?? []).find((x) => x.id.toString() === id)

  const { data: pipelinesData } = useReplicationPipelinesQuery({
    projectRef,
  })
  const pipeline = (pipelinesData?.pipelines ?? []).find((x) => x.destination_id.toString() === id)
  const { data: pipelineStatusData } = useReplicationPipelineStatusQuery(
    { projectRef, pipelineId: pipeline?.id },
    { refetchInterval: STATUS_REFRESH_FREQUENCY_MS }
  )
  const statusName = getStatusName(pipelineStatusData?.status)

  const config = destination?.config ?? {}
  const type =
    'big_query' in config ? 'BigQuery' : 'iceberg' in config ? 'Analytics Bucket' : undefined

  return (
    <NodeContainer className="justify-start gap-x-3">
      {type === 'BigQuery' ? (
        <BigQuery size={20} className="text-foreground-light" />
      ) : type === 'Analytics Bucket' ? (
        <AnalyticsBucket size={20} className="text-foreground-light" />
      ) : null}
      <div className="flex flex-col gap-y-0.5">
        <div className="flex items-center">
          <p className="text-sm">{destination?.name}</p>
          <Tooltip>
            <TooltipTrigger>
              <div className="w-6 h-full flex items-center justify-center">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    statusName === 'started'
                      ? 'bg-brand'
                      : statusName === 'failed'
                        ? 'bg-destructive'
                        : 'bg-selection'
                  )}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="capitalize">
              {statusName}
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="text-sm text-foreground-light">
          {type} (ID: {destination?.id})
        </p>
      </div>
      <Handle type="target" position={Position.Left} className="opacity-25" />
    </NodeContainer>
  )
}

export const ReadReplicaNode = ({ id }: { id: string }) => {
  const { ref: projectRef } = useParams()
  const { data: databases = [] } = useReadReplicasQuery({ projectRef })
  const database = databases.find((x) => x.identifier === id)

  const regionLabel = Object.values(AWS_REGIONS).find(
    (x) => x.code === database?.region
  )?.displayName
  const formattedId = formatDatabaseID(database?.identifier ?? '')
  const statusLabel = useMemo(
    () => getStatusLabel({ status: database?.status }),
    [database?.status]
  )

  return (
    <NodeContainer className="justify-start gap-x-3">
      <Database size={20} className="text-foreground-light" />
      <div className="flex flex-col gap-y-0.5">
        <div className="flex items-center">
          <p className="text-sm">{regionLabel}</p>
          <Tooltip>
            <TooltipTrigger>
              <div className="w-6 h-full flex items-center justify-center">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    database?.status === 'ACTIVE_HEALTHY' ? 'bg-brand' : 'bg-selection'
                  )}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">{statusLabel}</TooltipContent>
          </Tooltip>
        </div>
        <p className="text-sm text-foreground-light">Read Replica (ID: {formattedId})</p>
      </div>
      <Handle type="target" position={Position.Left} className="opacity-25" />
    </NodeContainer>
  )
}
