import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { Database, DatabaseBackup, HelpCircle, Loader2, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { Handle, NodeProps, Position } from 'reactflow'

import { useParams } from 'common'
import SparkBar from 'components/ui/SparkBar'
import {
  DatabaseInitEstimations,
  ReplicaInitializationStatus,
  useReadReplicasStatusesQuery,
} from 'data/read-replicas/replicas-status-query'
import { formatDatabaseID } from 'data/read-replicas/replicas.utils'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { BASE_PATH } from 'lib/constants'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'
import {
  ERROR_STATES,
  INIT_PROGRESS,
  NODE_SEP,
  NODE_WIDTH,
  REPLICA_STATUS,
  Region,
} from './InstanceConfiguration.constants'
import { formatSeconds } from './InstanceConfiguration.utils'

interface NodeData {
  id: string
  provider: string
  region: Region
  computeSize: string
  status: string
  inserted_at: string
}

interface PrimaryNodeData extends NodeData {
  numReplicas: number
  numRegions: number
  hasLoadBalancer: boolean
}

interface LoadBalancerData extends NodeData {
  numDatabases: number
}

interface ReplicaNodeData extends NodeData {
  onSelectRestartReplica: () => void
  onSelectResizeReplica: () => void
  onSelectDropReplica: () => void
}

export const LoadBalancerNode = ({ data }: NodeProps<LoadBalancerData>) => {
  const { ref } = useParams()
  const { numDatabases } = data

  return (
    <>
      <div className="flex flex-col rounded bg-surface-100 border border-default">
        <div
          className="flex items-start justify-between p-3 gap-x-4"
          style={{ width: NODE_WIDTH / 2 - 10 }}
        >
          <div className="flex gap-x-3">
            <div className="min-w-8 h-8 bg-blue-600 border border-blue-800 rounded-md flex items-center justify-center">
              <Database size={16} />
            </div>
            <div className="flex flex-col gap-y-0.5">
              <p className="text-sm">API Load Balancer</p>
              <p className="text-sm text-foreground-light">
                Distributes incoming API requests across{' '}
                <span className="text-foreground">{numDatabases} databases</span>
              </p>
            </div>
          </div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button type="text" icon={<MoreVertical />} className="px-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" side="bottom" align="end">
              <DropdownMenuItem asChild className="gap-x-2">
                <Link href={`/project/${ref}/settings/api?source=loadbalancer`}>View API URL</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent' }} />
    </>
  )
}

export const PrimaryNode = ({ data }: NodeProps<PrimaryNodeData>) => {
  // [Joshen] Just FYI Handles cannot be conditionally rendered
  const { provider, region, computeSize, numReplicas, numRegions, hasLoadBalancer } = data

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className={!hasLoadBalancer ? 'opacity-0' : ''}
        style={{ background: 'transparent' }}
      />
      <div className="flex flex-col rounded bg-surface-100 border border-default">
        <div
          className="flex items-start justify-between p-3"
          style={{ width: NODE_WIDTH / 2 - 10 }}
        >
          <div className="flex gap-x-3">
            <div className="w-8 h-8 bg-brand-500 border border-brand-600 rounded-md flex items-center justify-center">
              <Database size={16} />
            </div>
            <div className="flex flex-col gap-y-0.5">
              <p className="text-sm">Primary Database</p>
              <p className="flex items-center gap-x-1">
                <span className="text-sm text-foreground-light">{region.name}</span>
              </p>
              <p className="flex items-center gap-x-1">
                <span className="text-sm text-foreground-light">{provider}</span>
                <span className="text-sm text-foreground-light">•</span>
                <span className="text-sm text-foreground-light">{computeSize}</span>
              </p>
            </div>
          </div>
          <img
            alt="region icon"
            className="w-8 rounded-sm mt-0.5"
            src={`${BASE_PATH}/img/regions/${region.key}.svg`}
          />
        </div>
        {numReplicas > 0 && (
          <div className="border-t p-3 py-2">
            <p className="text-sm text-foreground-light">
              <span className="text-foreground">
                {numReplicas} replica{numReplicas > 1 ? 's' : ''}
              </span>{' '}
              deployed across{' '}
              <span className="text-foreground">
                {numRegions} region{numRegions > 1 ? 's' : ''}
              </span>
            </p>
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className={numReplicas === 0 ? 'opacity-0' : ''}
        style={{ background: 'transparent' }}
      />
    </>
  )
}

export const ReplicaNode = ({ data }: NodeProps<ReplicaNodeData>) => {
  const {
    id,
    provider,
    region,
    computeSize,
    status,
    inserted_at,
    onSelectRestartReplica,
    onSelectResizeReplica,
    onSelectDropReplica,
  } = data
  const { ref } = useParams()
  const created = dayjs(inserted_at).format('DD MMM YYYY')
  const canManageReplicas = useCheckPermissions(PermissionAction.CREATE, 'projects')

  const { data: databaseStatuses } = useReadReplicasStatusesQuery({ projectRef: ref })
  const { replicaInitializationStatus } =
    (databaseStatuses ?? []).find((db) => db.identifier === id) || {}

  const {
    status: initStatus,
    progress,
    estimations,
    error,
  } = (replicaInitializationStatus as {
    status?: string
    progress?: string
    estimations?: DatabaseInitEstimations
    error?: string
  }) ?? { status: undefined, progress: undefined, estimations: undefined, error: undefined }

  const stage = progress !== undefined ? Number(progress.split('_')[0]) : 0
  const stagePercent = stage / (Object.keys(INIT_PROGRESS).length - 1)

  const isInTransition =
    (
      [
        REPLICA_STATUS.UNKNOWN,
        REPLICA_STATUS.COMING_UP,
        REPLICA_STATUS.GOING_DOWN,
        REPLICA_STATUS.RESTORING,
        REPLICA_STATUS.RESTARTING,
        REPLICA_STATUS.RESIZING,
        REPLICA_STATUS.INIT_READ_REPLICA,
      ] as string[]
    ).includes(status) || initStatus === ReplicaInitializationStatus.InProgress

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: 'transparent' }} />
      <div
        className="flex justify-between items-start rounded bg-surface-100 border border-default p-3"
        style={{ width: NODE_WIDTH / 2 - 10 }}
      >
        <div className="flex gap-x-3">
          <div
            className={cn(
              'w-8 h-8 border rounded-md flex items-center justify-center',
              status === REPLICA_STATUS.ACTIVE_HEALTHY &&
                initStatus === ReplicaInitializationStatus.Completed
                ? 'bg-brand-400 border-brand-500'
                : 'bg-surface-100 border-foreground/20'
            )}
          >
            {isInTransition ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <DatabaseBackup size={16} />
            )}
          </div>
          <div className="flex flex-col gap-y-0.5">
            <div className="flex items-center gap-x-2">
              <p className="text-sm truncate">
                Replica {id.length > 0 && `(ID: ${formatDatabaseID(id)})`}
              </p>
              {initStatus === ReplicaInitializationStatus.InProgress ||
              status === REPLICA_STATUS.COMING_UP ||
              status === REPLICA_STATUS.UNKNOWN ||
              status === REPLICA_STATUS.INIT_READ_REPLICA ? (
                <Badge>Coming up</Badge>
              ) : initStatus === ReplicaInitializationStatus.Failed ||
                status === REPLICA_STATUS.INIT_READ_REPLICA_FAILED ? (
                <>
                  <Badge variant="destructive">Init failed</Badge>
                  <Tooltip_Shadcn_>
                    <TooltipTrigger_Shadcn_>
                      <HelpCircle size={16} />
                    </TooltipTrigger_Shadcn_>
                    <TooltipContent_Shadcn_
                      side="bottom"
                      align="end"
                      alignOffset={-70}
                      className="w-60 text-center"
                    >
                      Replica failed to initialize. Please drop this replica and spin up a new one.
                    </TooltipContent_Shadcn_>
                  </Tooltip_Shadcn_>
                </>
              ) : status === REPLICA_STATUS.GOING_DOWN ? (
                <Badge>Going down</Badge>
              ) : status === REPLICA_STATUS.RESTARTING ? (
                <Badge>Restarting</Badge>
              ) : status === REPLICA_STATUS.RESIZING ? (
                <Badge>Resizing</Badge>
              ) : initStatus === ReplicaInitializationStatus.Completed &&
                status === REPLICA_STATUS.ACTIVE_HEALTHY ? (
                <Badge variant="brand">Healthy</Badge>
              ) : (
                <Badge variant="warning">Unhealthy</Badge>
              )}
            </div>
            <div className="my-0.5">
              <p className="text-sm text-foreground-light">{region.name}</p>
              <p className="flex text-sm text-foreground-light items-center gap-x-1">
                <span>{provider}</span>
                {!!computeSize && (
                  <>
                    <span>•</span>
                    <span>{computeSize}</span>
                  </>
                )}
              </p>
            </div>
            {initStatus === ReplicaInitializationStatus.InProgress && progress !== undefined ? (
              <Tooltip_Shadcn_>
                <TooltipTrigger_Shadcn_ asChild>
                  <div className="w-56">
                    <SparkBar
                      labelBottom={INIT_PROGRESS[progress as keyof typeof INIT_PROGRESS]}
                      labelBottomClass="text-xs !normal-nums text-foreground-light"
                      type="horizontal"
                      value={stagePercent * 100}
                      max={100}
                      barClass="bg-brand"
                    />
                  </div>
                </TooltipTrigger_Shadcn_>
                {estimations !== undefined && (
                  <TooltipContent_Shadcn_ asChild side="bottom">
                    <div className="w-56">
                      <p className="text-foreground-light mb-0.5">Duration estimates:</p>
                      {estimations.baseBackupDownloadEstimateSeconds !== undefined && (
                        <p>
                          Base backup download:{' '}
                          {formatSeconds(estimations.baseBackupDownloadEstimateSeconds)}
                        </p>
                      )}
                      {estimations.walArchiveReplayEstimateSeconds !== undefined && (
                        <p>
                          WAL archive replay:{' '}
                          {formatSeconds(estimations.walArchiveReplayEstimateSeconds)}
                        </p>
                      )}
                    </div>
                  </TooltipContent_Shadcn_>
                )}
              </Tooltip_Shadcn_>
            ) : error !== undefined ? (
              <p className="text-sm text-foreground-light">
                Error: {ERROR_STATES[error as keyof typeof ERROR_STATES]}
              </p>
            ) : (
              <p className="text-sm text-foreground-light">Created: {created}</p>
            )}
          </div>
        </div>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button type="text" icon={<MoreVertical />} className="px-1" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40" side="bottom" align="end">
            <DropdownMenuItem
              disabled={status !== REPLICA_STATUS.ACTIVE_HEALTHY}
              className="gap-x-2"
            >
              <Link href={`/project/${ref}/settings/database?connectionString=${id}`}>
                View connection string
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-x-2"
              disabled={status !== REPLICA_STATUS.ACTIVE_HEALTHY}
            >
              <Link href={`/project/${ref}/reports/database?db=${id}&chart=replication-lag`}>
                View replication lag
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-x-2"
              onClick={() => onSelectRestartReplica()}
              disabled={status !== REPLICA_STATUS.ACTIVE_HEALTHY}
            >
              Restart replica
            </DropdownMenuItem>
            {/* <DropdownMenuItem className="gap-x-2" onClick={() => onSelectResizeReplica()}>
                Resize replica
              </DropdownMenuItem> */}
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <DropdownMenuItem
                  className="gap-x-2 !pointer-events-auto"
                  disabled={!canManageReplicas}
                  onClick={() => {
                    if (canManageReplicas) onSelectDropReplica()
                  }}
                >
                  Drop replica
                </DropdownMenuItem>
              </TooltipTrigger_Shadcn_>
              {!canManageReplicas && (
                <TooltipContent_Shadcn_ side="left">
                  You need additional permissions to drop replicas
                </TooltipContent_Shadcn_>
              )}
            </Tooltip_Shadcn_>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}

export const RegionNode = ({ data }: any) => {
  const { region, numReplicas } = data
  const regionNodeWidth =
    20 + (NODE_WIDTH / 2 - 10) * numReplicas + (numReplicas - 1) * (NODE_SEP + 10)

  return (
    <div
      className="relative flex justify-between rounded bg-black/10 border border-default border-white/10 border-2 p-3"
      style={{ width: regionNodeWidth, height: 162 }}
    >
      <div className="absolute bottom-2 flex items-center justify-between gap-x-2">
        <img
          alt="region icon"
          className="w-5 rounded-sm"
          src={`${BASE_PATH}/img/regions/${region.key}.svg`}
        />
        <p className="text-sm">{region.name}</p>
      </div>
    </div>
  )
}
