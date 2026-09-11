import { useParams } from 'common'
import {
  ArrowRight,
  ArrowUpCircle,
  CircleStop,
  Edit,
  MoreVertical,
  Play,
  RotateCcw,
  Trash,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsInteger, useQueryState } from 'nuqs'
import { PropsWithChildren, useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { PageBreadcrumbs, PageBreadcrumbsActions } from 'ui-patterns/PageBreadcrumbs'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderIcon,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { DeleteDestination } from './DeleteDestination'
import { DestinationLogo } from './DestinationLogo'
import { DestinationPanel } from './DestinationPanel/DestinationPanel'
import {
  getPipelineDisplayState,
  getStatusName,
  PIPELINE_ACTIONABLE_STATES,
} from './Pipeline.utils'
import { PipelineStatePill } from './PipelineStatePill'
import { PipelineStatusName, STATUS_REFRESH_FREQUENCY_MS } from './Replication.constants'
import { getReplicationDestinationType } from './ReplicationDiagram/Nodes.utils'
import { UpdateVersionModal } from './UpdateVersionModal'
import { DocsButton } from '@/components/ui/DocsButton'
import { useDeleteDestinationPipelineMutation } from '@/data/replication/delete-destination-pipeline-mutation'
import { useReplicationDestinationByIdQuery } from '@/data/replication/destination-by-id-query'
import { useReplicationPipelineByIdQuery } from '@/data/replication/pipeline-by-id-query'
import { useReplicationPipelineStatusQuery } from '@/data/replication/pipeline-status-query'
import { useReplicationPipelineVersionQuery } from '@/data/replication/pipeline-version-query'
import { useRestartPipelineMutation } from '@/data/replication/restart-pipeline-mutation'
import { useStartPipelineMutation } from '@/data/replication/start-pipeline-mutation'
import { useStopPipelineMutation } from '@/data/replication/stop-pipeline-mutation'
import { DOCS_URL } from '@/lib/constants'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'
import { type ResponseError } from '@/types'

type LifecycleAction = 'start' | 'stop' | 'restart'

const LIFECYCLE_BY_STATUS: Partial<
  Record<PipelineStatusName, { label: string; action: LifecycleAction; icon: ReactNode }>
> = {
  [PipelineStatusName.STOPPED]: { label: 'Start', action: 'start', icon: <Play /> },
  [PipelineStatusName.STARTED]: { label: 'Stop', action: 'stop', icon: <CircleStop /> },
  [PipelineStatusName.FAILED]: { label: 'Restart', action: 'restart', icon: <RotateCcw /> },
}

export const ReplicationPipelineLayout = ({ children }: PropsWithChildren) => {
  const { ref: projectRef, pipelineId: pipelineIdParam } = useParams()
  const pipelineId = Number(pipelineIdParam)
  const router = useRouter()
  const [showUpdateVersionModal, setShowUpdateVersionModal] = useState(false)
  const [showDeleteDestination, setShowDeleteDestination] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [, setEdit] = useQueryState(
    'edit',
    parseAsInteger.withOptions({ history: 'push', clearOnDefault: true })
  )
  const { getRequestStatus, setRequestStatus, updatePipelineStatus } = usePipelineRequestStatus()
  const requestStatus = getRequestStatus(pipelineId)

  const {
    data: pipeline,
    error: pipelineError,
    isPending: isPipelineLoading,
  } = useReplicationPipelineByIdQuery({
    projectRef,
    pipelineId,
  })
  const {
    data: pipelineStatusData,
    error: pipelineStatusError,
    isLoading: isPipelineStatusLoading,
    isError: isPipelineStatusError,
    isSuccess: isPipelineStatusSuccess,
  } = useReplicationPipelineStatusQuery(
    { projectRef, pipelineId },
    { enabled: !!pipelineId, refetchInterval: STATUS_REFRESH_FREQUENCY_MS }
  )
  const { data: versionData } = useReplicationPipelineVersionQuery({
    projectRef,
    pipelineId: pipeline?.id,
  })
  const { data: destination, isPending: isDestinationLoading } = useReplicationDestinationByIdQuery(
    {
      projectRef,
      destinationId: pipeline?.destination_id,
    }
  )

  const { mutateAsync: startPipeline, isPending: isStartingPipeline } = useStartPipelineMutation()
  const { mutateAsync: stopPipeline, isPending: isStoppingPipeline } = useStopPipelineMutation()
  const { mutateAsync: restartPipeline, isPending: isRestartingPipeline } =
    useRestartPipelineMutation()
  const { mutateAsync: deleteDestinationPipeline } = useDeleteDestinationPipelineMutation({})

  const statusName = getStatusName(pipelineStatusData?.status)
  const displayState = getPipelineDisplayState(requestStatus, statusName)
  const destinationType = getReplicationDestinationType(
    destination?.config as Record<string, unknown> | undefined
  )
  const isPipelineIdentityLoading =
    isPipelineLoading || (pipeline !== undefined && isDestinationLoading)
  const hasUpdate = Boolean(versionData?.new_version)
  const isTransitioning = requestStatus !== PipelineStatusRequestStatus.None
  const isActionable = PIPELINE_ACTIONABLE_STATES.includes(statusName as PipelineStatusName)

  // What the primary button offers for each state it can act on. Anything not listed here (a
  // pipeline mid-transition, or one in an unknown state) has no action, so the button falls back
  // to the display state's own label and renders no icon.
  const lifecycle = LIFECYCLE_BY_STATUS[statusName as PipelineStatusName]
  const primaryAction: LifecycleAction | undefined = lifecycle?.action
  const lifecycleLabel = isTransitioning
    ? displayState.label
    : (lifecycle?.label ?? displayState.label)
  // No icon while Starting/Stopping/Restarting: those states have no entry above, and the
  // button's loading state carries the transition anyway.
  const lifecycleIcon = lifecycle?.icon

  // The overflow menu carries the lifecycle actions the primary button isn't already offering,
  // so the detail page has the same reach as the row menu on the list without repeating itself.
  const isRunningOrFailed =
    statusName === PipelineStatusName.STARTED || statusName === PipelineStatusName.FAILED
  const canUseMenuActions = isRunningOrFailed && !isTransitioning && !!pipeline
  const canRestart = canUseMenuActions && primaryAction !== 'restart'
  const canStop = canUseMenuActions && primaryAction !== 'stop'

  const onLifecycleAction = async (action?: LifecycleAction) => {
    const resolvedAction = action ?? primaryAction
    if (!projectRef || !pipeline || resolvedAction === undefined) return

    try {
      if (resolvedAction === 'start') {
        setRequestStatus(pipeline.id, PipelineStatusRequestStatus.StartRequested, statusName)
        await startPipeline({ projectRef, pipelineId: pipeline.id })
      } else if (resolvedAction === 'stop') {
        setRequestStatus(pipeline.id, PipelineStatusRequestStatus.StopRequested, statusName)
        await stopPipeline({ projectRef, pipelineId: pipeline.id })
      } else {
        setRequestStatus(pipeline.id, PipelineStatusRequestStatus.RestartRequested, statusName)
        await restartPipeline({ projectRef, pipelineId: pipeline.id })
      }
    } catch (error) {
      setRequestStatus(pipeline.id, PipelineStatusRequestStatus.None)
      toast.error(`Failed to ${resolvedAction} pipeline: ${(error as ResponseError).message}`)
    }
  }

  const onDeleteDestination = async () => {
    if (!projectRef || !pipeline) return

    try {
      setIsDeleting(true)
      await stopPipeline({ projectRef, pipelineId: pipeline.id })
      await deleteDestinationPipeline({
        projectRef,
        destinationId: pipeline.destination_id,
        pipelineId: pipeline.id,
      })
      setShowDeleteDestination(false)
      toast.success(`Deleted pipeline "${pipeline.destination_name}"`)
      router.push(`/project/${projectRef}/database/replication`)
    } catch (error) {
      toast.error(`Failed to delete pipeline: ${(error as ResponseError).message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    updatePipelineStatus(pipelineId, statusName)
  }, [pipelineId, statusName, updatePipelineStatus])

  const logsUrl = `/project/${projectRef}/logs/replication-logs?f=${encodeURIComponent(
    JSON.stringify({ pipeline_id: pipelineId })
  )}`

  return (
    <div className="flex min-h-full w-full flex-col items-stretch">
      <div className="bg-surface-75">
        <PageBreadcrumbs
          slotClassName="sticky top-0 z-20 bg-sidebar"
          actions={
            <PageBreadcrumbsActions>
              <DocsButton href={`${DOCS_URL}/guides/database/replication`} />
              <Button asChild variant="default">
                <Link href={logsUrl}>View logs</Link>
              </Button>
            </PageBreadcrumbsActions>
          }
        >
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/project/${projectRef}/database/replication`}>Replication</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {isPipelineLoading ? (
                  <span className="inline-flex items-center">
                    <span className="sr-only">Loading pipeline</span>
                    <ShimmeringLoader className="h-3 w-24 py-0" />
                  </span>
                ) : (
                  (pipeline?.destination_name ?? 'Pipeline')
                )}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </PageBreadcrumbs>

        <PageHeader size="full" className="border-b py-4 [&>div]:px-4 [&>div]:xl:px-4">
          <PageHeaderMeta className="px-0 xl:px-0">
            <PageHeaderIcon>
              {isPipelineIdentityLoading ? (
                <ShimmeringLoader className="h-14 w-14 rounded-lg py-0" />
              ) : destinationType !== undefined ? (
                <DestinationLogo type={destinationType} size="large" />
              ) : (
                <span className="block h-14 w-14 rounded-lg border bg-surface-100" />
              )}
            </PageHeaderIcon>
            <PageHeaderSummary>
              <PageHeaderTitle>
                {isPipelineLoading ? (
                  <span className="inline-flex items-center">
                    <span className="sr-only">Loading pipeline</span>
                    <ShimmeringLoader className="h-6 w-40 py-0" />
                  </span>
                ) : (
                  (pipeline?.destination_name ?? 'Pipeline')
                )}
              </PageHeaderTitle>
              <PageHeaderDescription className="flex flex-row flex-wrap items-center gap-x-1.5 gap-y-1 text-sm!">
                <PipelineStatePill
                  pipelineStatus={pipelineStatusData?.status}
                  error={pipelineStatusError}
                  isLoading={isPipelineLoading || isPipelineStatusLoading}
                  isError={isPipelineStatusError}
                  isSuccess={isPipelineStatusSuccess}
                  requestStatus={requestStatus}
                  projectRef={projectRef}
                  pipelineId={pipelineId}
                />
                <span aria-hidden className="text-foreground-lighter">
                  &middot;
                </span>
                <span className="flex items-center gap-x-1.5 text-foreground-light">
                  <span>Primary database</span>
                  <ArrowRight size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                  {isPipelineIdentityLoading ? (
                    <span className="inline-flex items-center">
                      <span className="sr-only">Loading destination</span>
                      <ShimmeringLoader className="h-3 w-20 py-0" />
                    </span>
                  ) : (
                    <span>{destinationType ?? pipeline?.destination_name ?? 'Unknown'}</span>
                  )}
                </span>
              </PageHeaderDescription>
            </PageHeaderSummary>

            <PageHeaderAside>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {hasUpdate && (
                  <Button
                    variant="primary"
                    icon={<ArrowUpCircle />}
                    onClick={() => setShowUpdateVersionModal(true)}
                  >
                    Update available
                  </Button>
                )}
                <Button
                  variant={
                    !hasUpdate && statusName === PipelineStatusName.STOPPED ? 'primary' : 'default'
                  }
                  icon={lifecycleIcon}
                  onClick={() => onLifecycleAction()}
                  loading={
                    Boolean(pipelineError) ||
                    displayState.type === 'loading' ||
                    isTransitioning ||
                    isStartingPipeline ||
                    isStoppingPipeline ||
                    isRestartingPipeline
                  }
                  disabled={!pipeline || isTransitioning || !isActionable}
                >
                  {lifecycleLabel}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="default"
                      className="px-1.25 hit-area-2"
                      aria-label="Pipeline options"
                      icon={<MoreVertical />}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="end" className="w-52">
                    {canRestart && (
                      <DropdownMenuItem
                        className="gap-x-2"
                        onClick={() => onLifecycleAction('restart')}
                      >
                        <RotateCcw size={14} />
                        <span>Restart pipeline</span>
                      </DropdownMenuItem>
                    )}
                    {canStop && (
                      <DropdownMenuItem
                        className="gap-x-2"
                        onClick={() => onLifecycleAction('stop')}
                      >
                        <CircleStop size={14} />
                        <span>Stop pipeline</span>
                      </DropdownMenuItem>
                    )}
                    {(canRestart || canStop) && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      className="gap-x-2"
                      disabled={pipeline === undefined}
                      onClick={() => {
                        if (pipeline !== undefined) setEdit(pipeline.destination_id)
                      }}
                    >
                      <Edit size={14} />
                      <span>Edit pipeline</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-x-2"
                      disabled={pipeline === undefined}
                      onClick={() => setShowDeleteDestination(true)}
                    >
                      <Trash size={14} />
                      <span>Delete pipeline</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </PageHeaderAside>
          </PageHeaderMeta>
        </PageHeader>
      </div>

      {children}

      <DestinationPanel />

      <DeleteDestination
        visible={showDeleteDestination}
        setVisible={setShowDeleteDestination}
        onDelete={onDeleteDestination}
        isLoading={isDeleting}
        name={pipeline?.destination_name ?? ''}
      />

      <UpdateVersionModal
        visible={showUpdateVersionModal}
        pipeline={pipeline}
        onClose={() => setShowUpdateVersionModal(false)}
        confirmLabel={
          statusName === PipelineStatusName.STARTED || statusName === PipelineStatusName.FAILED
            ? 'Update and restart'
            : 'Update version'
        }
      />
    </div>
  )
}
