import { Handle, Node, NodeProps, Position } from '@xyflow/react'
import { useParams } from 'common'
import { Database, DatabaseBackup, HelpCircle, Layers, Loader2, Network } from 'lucide-react'
import { Badge, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { ComputeMetricsFooter } from './ComputeMetricsFooter'
import {
  HaPoolerNodeData,
  HaShardNodeData,
  MultigatewayNodeData,
} from './HaInstanceConfiguration.utils'
import {
  formatCellAsAvailabilityZone,
  getPoolerStatus,
  HA_POOLER_STATUS_LABELS,
  HaPoolerStatus,
} from './HaTopology.utils'
import { AVAILABLE_REPLICA_REGIONS, NODE_WIDTH } from './InstanceConfiguration.constants'
import { useHaPooler } from './useHaPooler'
import { usePrimaryDatabase } from '@/data/read-replicas/replicas-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { BASE_PATH } from '@/lib/constants'

const STATUS_BADGE_VARIANTS: Record<HaPoolerStatus, 'success' | 'warning' | 'default'> = {
  healthy: 'success',
  coming_up: 'default',
  going_down: 'default',
  unhealthy: 'warning',
}

const PoolerStatusBadge = ({ status }: { status: HaPoolerStatus }) => (
  <Badge variant={STATUS_BADGE_VARIANTS[status]}>{HA_POOLER_STATUS_LABELS[status]}</Badge>
)

export const MultigatewayNode = ({ data }: NodeProps<Node<MultigatewayNodeData>>) => {
  const { numGateways } = data

  return (
    <>
      <div className="flex flex-col rounded-sm bg-surface-100 border border-default">
        <div className="flex items-start p-3 gap-x-4" style={{ width: NODE_WIDTH / 2 - 10 }}>
          <div className="flex gap-x-3">
            <div className="min-w-8 h-8 bg-blue-600 border border-blue-800 rounded-md flex items-center justify-center">
              <Network size={16} />
            </div>
            <div className="flex flex-col gap-y-0.5">
              <p className="text-sm">Multigateway</p>
              <p className="flex items-center gap-x-1 text-sm text-foreground-light">
                <span>Load balancer</span>
                {numGateways > 1 && (
                  <>
                    <span className="text-foreground-lighter">·</span>
                    <span>{numGateways} instances</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent' }} />
    </>
  )
}

export const HaPrimaryNode = ({ data }: NodeProps<Node<HaPoolerNodeData>>) => {
  // [Joshen] Just FYI Handles cannot be conditionally rendered
  const { cell, name, hasGateway } = data
  const { ref: projectRef } = useParams()
  const { projectHomepageShowInstanceSize } = useIsFeatureEnabled([
    'project_homepage:show_instance_size',
  ])

  // Region and compute size aren't in multiadmin — they come from the primary
  // database row. HA locks compute to one project-level size, so the primary's
  // size is correct for every node in the cluster.
  const { database: primary } = usePrimaryDatabase({ projectRef })
  const { data: pooler } = useHaPooler({ cell, name })

  const status = pooler !== undefined ? getPoolerStatus(pooler) : undefined
  const region = AVAILABLE_REPLICA_REGIONS.find((r) => primary?.region.includes(r.region))
  const availabilityZone = formatCellAsAvailabilityZone(cell)

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className={!hasGateway ? 'opacity-0' : ''}
        style={{ background: 'transparent' }}
      />
      <div className="flex flex-col rounded-sm bg-surface-100 border border-brand-600">
        <div
          className="flex items-start justify-between p-3"
          style={{ width: NODE_WIDTH / 2 - 10 }}
        >
          <div className="flex gap-x-3">
            <div className="w-8 h-8 bg-brand-500 border border-brand-600 rounded-md flex items-center justify-center">
              <Database size={16} />
            </div>
            <div className="flex flex-col gap-y-0.5">
              <div className="flex items-center gap-x-2">
                <p className="text-sm">Primary Database</p>
                {status !== undefined && <PoolerStatusBadge status={status} />}
              </div>
              {region !== undefined && (
                <p className="text-sm text-foreground-light">{region.name}</p>
              )}
              <p className="flex items-center gap-x-1 text-sm text-foreground-light">
                {availabilityZone !== undefined && <span>{availabilityZone}</span>}
                {projectHomepageShowInstanceSize && !!primary?.size && (
                  <>
                    <span className="text-foreground-lighter">·</span>
                    <span>{primary.size}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          {region !== undefined && (
            <img
              alt="region icon"
              className="w-8 rounded-xs mt-0.5"
              src={`${BASE_PATH}/img/regions/${region.region}.svg`}
            />
          )}
        </div>
        {/* Whether connection metrics are meaningful through the multigateway
            is unconfirmed, so they're left off for HA projects. */}
        <ComputeMetricsFooter showConnections={false} />
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent' }} />
    </>
  )
}

export const HaReplicaNode = ({ data }: NodeProps<Node<HaPoolerNodeData>>) => {
  const { cell, name } = data
  const { ref: projectRef } = useParams()
  const { projectHomepageShowInstanceSize } = useIsFeatureEnabled([
    'project_homepage:show_instance_size',
  ])

  const { database: primary } = usePrimaryDatabase({ projectRef })
  const { data: pooler } = useHaPooler({ cell, name })

  const status = pooler !== undefined ? getPoolerStatus(pooler) : undefined
  const availabilityZone = formatCellAsAvailabilityZone(cell)

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: 'transparent' }} />
      <div
        className="flex items-start rounded-sm bg-surface-100 border border-default p-3"
        style={{ width: NODE_WIDTH / 2 - 10 }}
      >
        <div className="flex gap-x-3">
          <div
            className={cn(
              'w-8 h-8 border rounded-md flex items-center justify-center',
              status === 'healthy'
                ? 'bg-brand-400 border-brand-500'
                : 'bg-surface-100 border-foreground/20'
            )}
          >
            {status === 'coming_up' ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <DatabaseBackup size={16} />
            )}
          </div>
          <div className="flex flex-col gap-y-0.5">
            <div className="flex items-center gap-x-2">
              <p className="text-sm">Read Replica</p>
              {status !== undefined && <PoolerStatusBadge status={status} />}
            </div>
            <p className="flex items-center gap-x-1 text-sm text-foreground-light">
              {availabilityZone !== undefined && <span>{availabilityZone}</span>}
              {projectHomepageShowInstanceSize && !!primary?.size && (
                <>
                  <span className="text-foreground-lighter">·</span>
                  <span>{primary.size}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export const HaShardNode = ({ data }: NodeProps<Node<HaShardNodeData>>) => {
  const { name, numNodes, width, height } = data

  return (
    <div
      className="relative rounded-md border border-default bg-surface-100/25"
      style={{ width, height }}
    >
      <div className="pointer-events-auto absolute top-3 left-3 flex items-center gap-x-2 rounded-full border border-default bg-surface-100 pl-3 pr-2 py-1">
        <Layers size={14} className="text-foreground-light" />
        <p className="text-sm">{name}</p>
        <Badge>{numNodes}</Badge>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-x-1 text-sm text-foreground-light">
              Automatic failover
              <HelpCircle size={14} />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-72 text-center">
            If the primary database fails, a replica in this shard is automatically promoted to take
            its place.
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
