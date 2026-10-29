import { Handle, Position } from '@xyflow/react'
import { useParams } from 'common'
import { PropsWithChildren } from 'react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { DestinationLogo } from '../DestinationLogo'
import { getStatusName } from '../Pipeline.utils'
import { getDestinationStorageRegion } from '../PipelineConnectionDetails.utils'
import { ReplicationRegionLabel } from '../ReplicationRegionLabel'
import { getReplicationDestinationType } from './Nodes.utils'
import { useReplicationDestinationsQuery } from '@/data/replication/destinations-query'
import { useReplicationPipelineStatusQuery } from '@/data/replication/pipeline-status-query'
import { useReplicationPipelinesQuery } from '@/data/replication/pipelines-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const NODE_WIDTH = 480

const NodeContainer = ({ className, children }: PropsWithChildren<{ className?: string }>) => {
  return (
    <div
      style={{ width: NODE_WIDTH / 2 + 55 }}
      className={cn(
        'flex items-start justify-between p-3 rounded-sm bg-surface-100 border border-default',
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

  const { data: destinationsData } = useReplicationDestinationsQuery({ projectRef })
  const hasDestinations = (destinationsData?.destinations ?? []).length > 0

  return (
    <NodeContainer>
      <div className="text-sm flex flex-col gap-y-0.5">
        <p className="text-xs uppercase tracking-wide text-foreground-lighter">Source</p>
        <p>Primary Database</p>
        {project?.region && (
          <ReplicationRegionLabel
            code={project.region}
            className="mt-2 text-sm text-foreground-light"
          />
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className={hasDestinations ? 'opacity-25' : 'opacity-0'}
      />
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
  const { data: pipelineStatusData } = useReplicationPipelineStatusQuery({
    projectRef,
    pipelineId: pipeline?.id,
  })
  const statusName = getStatusName(pipelineStatusData?.status)

  const type = getReplicationDestinationType(destination?.config)
  const storageRegion = getDestinationStorageRegion(destination?.config)

  return (
    <NodeContainer>
      <div className="text-sm flex flex-col gap-y-0.5">
        <p className="text-xs uppercase tracking-wide text-foreground-lighter">Destination</p>
        <div className="flex items-center">
          <p>{type}</p>
          {(statusName === 'started' || statusName === 'failed') && (
            <Tooltip>
              <TooltipTrigger>
                <div className="w-6 h-full flex items-center justify-center">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      statusName === 'started' ? 'bg-brand-default' : 'bg-destructive'
                    )}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="capitalize">
                {statusName}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="text-foreground-light">{destination?.name}</p>
        <p className="text-foreground-light">ID: {destination?.id}</p>
        {storageRegion && (
          <div className="mt-1 max-w-56 text-xs text-foreground-light">
            <p className="text-foreground-lighter">Storage region</p>
            <ReplicationRegionLabel
              code={storageRegion}
              className="text-sm text-foreground-light"
            />
          </div>
        )}
      </div>
      {type ? <DestinationLogo type={type} /> : null}
      <Handle type="target" position={Position.Left} className="opacity-25" />
    </NodeContainer>
  )
}
