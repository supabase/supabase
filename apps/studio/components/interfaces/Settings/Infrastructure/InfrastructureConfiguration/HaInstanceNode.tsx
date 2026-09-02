import { Handle, Node, NodeProps, Position } from '@xyflow/react'
import { Database, DatabaseBackup, HelpCircle, Layers, Loader2, Network } from 'lucide-react'
import { type ReactNode } from 'react'
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
import { RegionFlag } from '@/components/ui/RegionFlag'

const STATUS_BADGE_VARIANTS: Record<
  HaPoolerStatus,
  'success' | 'warning' | 'destructive' | 'default'
> = {
  healthy: 'success',
  coming_up: 'default',
  going_down: 'default',
  unhealthy: 'destructive',
}

const PoolerStatusBadge = ({ status }: { status: HaPoolerStatus }) => (
  <Badge variant={STATUS_BADGE_VARIANTS[status]}>{HA_POOLER_STATUS_LABELS[status]}</Badge>
)

const PromotionBadge = ({ state }: { state: NonNullable<HaPoolerNodeData['promotion']> }) => (
  <span
    className={cn(
      'relative inline-flex items-center justify-center overflow-hidden rounded-md text-center font-mono uppercase',
      'whitespace-nowrap font-medium tracking-[0.06em] text-[11px] leading-[1.1] px-[5.5px] py-[3px]',
      'border border-purple-700 bg-purple-400 text-purple-1100',
      'dark:border-purple-600/50 dark:bg-purple-100'
    )}
  >
    {state === 'promoting' ? 'Promoting' : 'Promoted'}
    <span className="animate-badge-shimmer pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-white/35 to-transparent blur-md" />
  </span>
)

const PoolerCardTitleRow = ({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) => (
  <div className="flex items-center justify-between gap-x-2">
    <p className="text-sm">{title}</p>
    {children !== undefined && (
      <div className="inline-flex shrink-0 items-center gap-x-2">{children}</div>
    )}
  </div>
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
    {availabilityZone !== undefined && !!computeSize && (
      <span className="text-foreground-lighter">·</span>
    )}
    {!!computeSize && <span>{computeSize}</span>}
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
              <Network aria-hidden="true" size={16} />
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
  const { cell, name, hasGateway, statusOverride } = data
  const { status, availabilityZone, computeSize, primaryRegion } = useHaPoolerCard({
    cell,
    name,
    statusOverride,
  })

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className={!hasGateway ? 'opacity-0' : ''}
        style={{ background: 'transparent' }}
      />
      <div
        className={cn(
          'flex flex-col rounded-sm bg-surface-100 border border-default',
          status === 'unhealthy' &&
            'bg-destructive-200 border-destructive-400 motion-safe:animate-ha-primary-fail-flash'
        )}
      >
        <div className="flex gap-x-3 p-3" style={{ width: NODE_CARD_WIDTH }}>
          <div className="w-8 h-8 shrink-0 bg-brand-500 border border-brand-600 rounded-md flex items-center justify-center">
            <Database aria-hidden="true" size={16} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-y-0.5">
            <PoolerCardTitleRow title="Primary Database">
              {/* Stable live region so polled status changes are announced */}
              <span role="status" className="inline-flex items-center">
                {status !== undefined && <PoolerStatusBadge status={status} />}
              </span>
            </PoolerCardTitleRow>
            {primaryRegion !== undefined && (
              <p className="flex items-center gap-x-1.5 text-sm text-foreground-light">
                <RegionFlag className="w-4 shrink-0" region={primaryRegion.region} />
                <span>{primaryRegion.name}</span>
              </p>
            )}
            <PoolerCardSubtitle availabilityZone={availabilityZone} computeSize={computeSize} />
          </div>
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
  const { cell, name, promotion, statusOverride } = data
  const { status, availabilityZone, computeSize } = useHaPoolerCard({
    cell,
    name,
    statusOverride,
  })
  const isPromoting = promotion === 'promoting'

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: 'transparent' }} />
      <div
        className="flex gap-x-3 rounded-sm bg-surface-100 border border-default p-3"
        style={{ width: NODE_CARD_WIDTH }}
      >
        <div
          className={cn(
            'w-8 h-8 shrink-0 border rounded-md flex items-center justify-center',
            status === 'healthy'
              ? 'bg-brand-400 border-brand-500'
              : 'bg-surface-100 border-foreground/20'
          )}
        >
            {status === 'coming_up' || isPromoting ? (
              <Loader2 aria-hidden="true" className="motion-safe:animate-spin" size={16} />
            ) : (
              <DatabaseBackup aria-hidden="true" size={16} />
            )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-y-0.5">
          <PoolerCardTitleRow title="Read Replica">
            {promotion !== undefined && <PromotionBadge state={promotion} />}
            {/* Stable live region so polled status changes are announced */}
            <span role="status" className="inline-flex items-center">
              {status !== undefined && <PoolerStatusBadge status={status} />}
            </span>
          </PoolerCardTitleRow>
          <PoolerCardSubtitle availabilityZone={availabilityZone} computeSize={computeSize} />
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent' }} />
    </>
  )
}

export const HaShardNode = ({ data }: NodeProps<Node<HaShardNodeData>>) => {
  const { name } = data

  return (
    <div className="relative h-full w-full rounded-md border border-default bg-surface-100/25">
      <div className="pointer-events-auto absolute top-3 left-3 flex items-center gap-x-2 rounded-full border border-default bg-surface-100 pl-3 pr-2 py-1">
        <Layers aria-hidden="true" size={14} className="text-foreground-light" />
        <p className="text-sm">{name}</p>
        <Tooltip>
          {/* Renders a button so the explanation is keyboard reachable */}
          <TooltipTrigger className="flex items-center gap-x-1 text-sm text-foreground-light">
            Automatic failover
            <HelpCircle aria-hidden="true" size={14} />
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
