import { Handle, Position } from 'reactflow'

import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useReplicationDestinationsQuery } from '@/data/replication/destinations-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { BASE_PATH } from '@/lib/constants'
import { useParams } from 'common'
import { PropsWithChildren } from 'react'
import { AWS_REGIONS } from 'shared-data'

export const NODE_WIDTH = 450

const NodeContainer = ({ children }: PropsWithChildren) => {
  return (
    <div
      style={{ width: NODE_WIDTH / 2 + 55 }}
      className="flex items-start justify-between p-3 rounded bg-surface-100 border border-default"
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
        <p className="text-sm text-foreground-light">{regionLabel}</p>
        <p className="text-sm text-foreground-light">{project?.cloud_provider}</p>
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

export const ReplicationNode = () => {
  return (
    <NodeContainer>
      <div className="flex flex-col gap-y-0.5">
        <p className="text-sm">Replication</p>
        <p className="text-sm text-foreground-light">Something</p>
        <p className="text-sm text-foreground-light">Something</p>
      </div>
      <Handle type="target" position={Position.Left} className="opacity-25" />
    </NodeContainer>
  )
}

export const ReadReplicaNode = () => {
  return (
    <NodeContainer>
      <div className="flex flex-col gap-y-0.5">
        <p className="text-sm">Read Replica</p>
        <p className="text-sm text-foreground-light">Something</p>
        <p className="text-sm text-foreground-light">Something</p>
      </div>
      <Handle type="target" position={Position.Left} className="opacity-25" />
    </NodeContainer>
  )
}
