import { Handle, Position } from '@xyflow/react'
import { useParams } from 'common'
import { PropsWithChildren } from 'react'
import { AWS_REGIONS } from 'shared-data'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { DestinationLogo } from '../DestinationLogo'
import { getStatusName } from '../Pipeline.utils'
import { getReplicationDestinationType } from './Nodes.utils'
import { RegionFlag } from '@/components/ui/RegionFlag'
import type { ReplicationDestinationsData } from '@/data/replication/destinations-query'
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

export const PrimaryDatabaseNode = ({ data }: { data: { hasDestinations: boolean } }) => {
  const { data: project } = useSelectedProjectQuery()
  const { hasDestinations } = data

  const region = Object.values(AWS_REGIONS).find((x) => x.code === project?.region)

  return (
    <NodeContainer>
      <div className="text-sm flex flex-col gap-y-0.5">
        <p>Primary Database</p>
        <p className="text-foreground-light">{region?.displayName}</p>
        <p className="text-foreground-light">{region?.code}</p>
      </div>
      {!!project && <RegionFlag className="mt-0.5 w-8" region={project.region} />}
      <Handle
        type="source"
        position={Position.Right}
        className={hasDestinations ? 'opacity-25' : 'opacity-0'}
      />
    </NodeContainer>
  )
}

export const ReplicationNode = ({
  data,
}: {
  data: {
    destination: ReplicationDestinationsData['destinations'][number]
    clusterId: string | undefined
  }
}) => {
  const { ref: projectRef } = useParams()
  const { destination, clusterId } = data

  const { data: pipelinesData } = useReplicationPipelinesQuery({
    projectRef,
    clusterId,
  })
  const pipeline = pipelinesData?.pipelines.find((x) => x.destination_id === destination.id)
  const { data: pipelineStatusData } = useReplicationPipelineStatusQuery({
    projectRef,
    clusterId,
    pipelineId: pipeline?.id,
    clusterId,
  })
  const statusName = getStatusName(pipelineStatusData?.status)

  const type = getReplicationDestinationType(destination.config)

  return (
    <NodeContainer>
      <div className="text-sm flex flex-col gap-y-0.5">
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
        <p className="text-foreground-light">{destination.name}</p>
      </div>
      {type ? <DestinationLogo type={type} /> : null}
      <Handle type="target" position={Position.Left} className="opacity-25" />
    </NodeContainer>
  )
}
