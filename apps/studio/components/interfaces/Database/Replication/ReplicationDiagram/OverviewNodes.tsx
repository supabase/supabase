import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { useParams } from 'common'
import { ArrowRightIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import type { ReactNode } from 'react'
import { AWS_REGIONS } from 'shared-data'
import { cn } from 'ui'

import { DestinationLogo } from '../DestinationLogo'
import { PipelineStatePill } from '../PipelineStatePill'
import type { ReplicationDestinationType } from './Nodes.utils'
import { RegionFlag } from '@/components/ui/RegionFlag'
import { replicationPipelineStatusQueryOptions } from '@/data/replication/pipeline-status-query'
import { usePipelineRequestStatus } from '@/state/replication-pipeline-request-status'

export type OverviewNode = Node<{
  kind: 'source' | 'pipeline' | 'destination' | 'group' | 'junction'
  content: ReactNode
  sourceHandles?: { id: string; top: number }[]
  targetHandles?: { id: string; top: number }[]
}>

export function OverviewCard({ data }: NodeProps<OverviewNode>) {
  const { resolvedTheme } = useTheme()
  return (
    <div
      style={
        resolvedTheme === 'dark'
          ? { backgroundColor: 'var(--pipeline-dark-card-color)' }
          : undefined
      }
      className={cn(
        'w-full rounded-lg border shadow-xs select-text pointer-events-auto dark:border-strong',
        data.kind === 'pipeline' ? 'border-muted bg-surface-75' : 'border-default bg-surface-100'
      )}
    >
      {data.kind !== 'source' && !data.targetHandles && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-0 !w-0 !min-h-0 !min-w-0 !border-0 !opacity-0"
        />
      )}
      {data.kind !== 'destination' && !data.sourceHandles && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-0 !w-0 !min-h-0 !min-w-0 !border-0 !opacity-0"
        />
      )}
      {data.sourceHandles?.map(({ id, top }) => (
        <Handle
          key={id}
          id={id}
          type="source"
          position={Position.Right}
          style={{ top }}
          className="!h-0 !w-0 !min-h-0 !min-w-0 !border-0 !opacity-0"
        />
      ))}
      {data.targetHandles?.map(({ id, top }) => (
        <Handle
          key={id}
          id={id}
          type="target"
          position={Position.Left}
          style={{ top }}
          className="!h-0 !w-0 !min-h-0 !min-w-0 !border-0 !opacity-0"
        />
      ))}
      <div
        className={cn(
          'space-y-3 text-sm',
          data.kind === 'pipeline' && 'p-2 [&>div:first-child]:px-1 [&>div:first-child]:pt-1',
          data.kind === 'source' && 'p-3',
          data.kind === 'destination' && 'p-3'
        )}
      >
        {data.content}
      </div>
    </div>
  )
}

export function OverviewRegion({ name, code }: { name?: string; code?: string }) {
  const displayName = Object.values(AWS_REGIONS).find((region) => region.code === code)?.displayName
  const regionName = name ?? displayName
  const shortName = regionName?.match(/\(([^)]+)\)$/)?.[1] ?? regionName
  return (
    <div className="flex items-center gap-2">
      {code && <RegionFlag className="w-4 shrink-0" region={code} />}
      <span title={code}>{shortName ?? 'Region unavailable'}</span>
    </div>
  )
}

export function PipelineLink({
  projectRef,
  clusterId,
  id,
  name,
  children,
}: {
  projectRef: string
  clusterId?: string
  id: string
  name: string
  children?: ReactNode
}) {
  return (
    <Link
      className="pointer-events-auto group relative flex h-12 min-w-0 flex-col items-start justify-center gap-0.25 rounded-sm px-2 pr-7 hover:bg-surface-200 focus-visible:bg-surface-200 focus-visible:outline-none transition-colors"
      title={name}
      aria-label={name}
      to="/project/$ref/database/pipelines/$pipelineId"
      params={{ ref: projectRef, pipelineId: id }}
      search={clusterId === undefined ? {} : { cluster_id: clusterId }}
    >
      <span className="max-w-full truncate font-medium">{name}</span>
      {children}
      <ArrowRightIcon
        size={14}
        aria-hidden
        className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted opacity-20 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
      />
    </Link>
  )
}

export function OverviewDestination({
  type,
  label,
}: {
  type?: ReplicationDestinationType
  label?: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      {type && <DestinationLogo type={type} />}
      <div className="min-w-0">
        <p className="font-medium">{type ?? 'Destination unavailable'}</p>
        {label && (
          <p className="text-xs text-foreground-light [overflow-wrap:anywhere]" title={label}>
            {label}
          </p>
        )}
      </div>
    </div>
  )
}

export function OverviewPipelineStatus({
  pipelineId,
  clusterId,
}: {
  pipelineId: string
  clusterId?: string
}) {
  const { ref: projectRef } = useParams()
  const result = useQuery(
    replicationPipelineStatusQueryOptions({ projectRef, pipelineId, clusterId })
  )
  const { getRequestStatus } = usePipelineRequestStatus()
  return (
    <span className="pointer-events-auto">
      <PipelineStatePill
        withTooltip={false}
        shouldPulseRunning
        pipelineStatus={result.data?.status}
        error={result.error}
        isLoading={result.isPending}
        isError={result.isError}
        isSuccess={result.isSuccess}
        requestStatus={getRequestStatus(pipelineId)}
      />
    </span>
  )
}

export function OverviewGroup({ data }: NodeProps<OverviewNode>) {
  return (
    <div className="ml-0.5 inline-flex" style={{ backgroundColor: 'var(--pipeline-canvas-color)' }}>
      <span className="heading-meta px-1.5 py-0.5 text-foreground-lighter">{data.content}</span>
    </div>
  )
}

export function OverviewJunction() {
  return (
    <div className="h-px w-px">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-0 !w-0 !min-h-0 !min-w-0 !border-0 !opacity-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-0 !w-0 !min-h-0 !min-w-0 !border-0 !opacity-0"
      />
    </div>
  )
}
