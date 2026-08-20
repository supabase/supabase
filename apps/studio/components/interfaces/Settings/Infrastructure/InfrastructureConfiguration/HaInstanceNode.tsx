import { Handle, Node, NodeProps, Position } from '@xyflow/react'
import { Database, DatabaseBackup, HelpCircle, Layers, Loader2, Network } from 'lucide-react'
import { Badge, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { ComputeMetricsFooter } from './ComputeMetricsFooter'
import {
  HaPoolerNodeData,
  HaShardNodeData,
  MultigatewayNodeData,
} from './HaInstanceConfiguration.utils'
import { HA_POOLER_STATUS_LABELS, HaPoolerStatus } from './HaTopology.utils'
import { NODE_CARD_WIDTH } from './InstanceConfiguration.constants'
import { useHaPoolerCard } from './useHaPooler'
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

const PoolerCardSubtitle = ({
  availabilityZone,
  computeSize,
}: {
  availabilityZone?: string
  computeSize?: string
}) => (
  <p className="flex items-center gap-x-1 text-sm text-foreground-light">
    {availabilityZone !== undefined && <span>{availabilityZone}</span>}
    {!!computeSize && (
      <>
        <span className="text-foreground-lighter">·</span>
        <span>{computeSize}</span>
      </>
    )}
  </p>
)

export const MultigatewayNode = ({ data }: NodeProps<Node<MultigatewayNodeData>>) => {
  const { numGateways } = data

  return (
    <>
      <div className="flex flex-col rounded-sm bg-surface-100 border border-default">
        <div className="flex items-start p-3 gap-x-4" style={{ width: NODE_CARD_WIDTH }}>
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
  const { status, availabilityZone, computeSize, primaryRegion } = useHaPoolerCard({ cell, name })

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className={!hasGateway ? 'opacity-0' : ''}
        style={{ background: 'transparent' }}
      />
      {/* dark-mode brand-600 is the brightest step of the scale — use the
          deep brand-500 there so the ring marks the primary without glowing */}
      <div className="flex flex-col rounded-sm bg-surface-100 border border-brand-600 dark:border-brand-500">
        <div className="flex items-start justify-between p-3" style={{ width: NODE_CARD_WIDTH }}>
          <div className="flex gap-x-3">
            <div className="w-8 h-8 bg-brand-500 border border-brand-600 rounded-md flex items-center justify-center">
              <Database size={16} />
            </div>
            <div className="flex flex-col gap-y-0.5">
              <div className="flex items-center gap-x-2">
                <p className="text-sm">Primary Database</p>
                {/* Stable live region so polled status changes are announced */}
                <span role="status">
                  {status !== undefined && <PoolerStatusBadge status={status} />}
                </span>
              </div>
              {primaryRegion !== undefined && (
                <p className="text-sm text-foreground-light">{primaryRegion.name}</p>
              )}
              <PoolerCardSubtitle availabilityZone={availabilityZone} computeSize={computeSize} />
            </div>
          </div>
          {primaryRegion !== undefined && (
            // Decorative — the visible text next to it already names the region
            <img
              alt=""
              aria-hidden="true"
              className="w-8 rounded-xs mt-0.5"
              src={`${BASE_PATH}/img/regions/${primaryRegion.region}.svg`}
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
  const { status, availabilityZone, computeSize } = useHaPoolerCard({ cell, name })

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: 'transparent' }} />
      <div
        className="flex items-start rounded-sm bg-surface-100 border border-default p-3"
        style={{ width: NODE_CARD_WIDTH }}
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
              <Loader2 className="motion-safe:animate-spin" size={16} />
            ) : (
              <DatabaseBackup size={16} />
            )}
          </div>
          <div className="flex flex-col gap-y-0.5">
            <div className="flex items-center gap-x-2">
              <p className="text-sm">Read Replica</p>
              {/* Stable live region so polled status changes are announced */}
              <span role="status">
                {status !== undefined && <PoolerStatusBadge status={status} />}
              </span>
            </div>
            <PoolerCardSubtitle availabilityZone={availabilityZone} computeSize={computeSize} />
          </div>
        </div>
      </div>
    </>
  )
}

export const HaShardNode = ({ data }: NodeProps<Node<HaShardNodeData>>) => {
  const { name, numNodes } = data

  return (
    <div className="relative h-full w-full rounded-md border border-default bg-surface-100/25">
      <div className="pointer-events-auto absolute top-3 left-3 flex items-center gap-x-2 rounded-full border border-default bg-surface-100 pl-3 pr-2 py-1">
        <Layers size={14} className="text-foreground-light" />
        <p className="text-sm">{name}</p>
        <Badge>{numNodes}</Badge>
        <Tooltip>
          {/* Renders a button so the explanation is keyboard reachable */}
          <TooltipTrigger className="flex items-center gap-x-1 text-sm text-foreground-light">
            Automatic failover
            <HelpCircle size={14} />
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
