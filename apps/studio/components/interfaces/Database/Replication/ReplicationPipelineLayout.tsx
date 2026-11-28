import { Link, useNavigate } from '@tanstack/react-router'
import { useParams } from 'common'
import {
  ArrowRightIcon,
  ArrowUpCircleIcon,
  CircleStopIcon,
  EditIcon,
  MoreVerticalIcon,
  PlayIcon,
  RotateCcwIcon,
  TrashIcon,
} from 'lucide-react'
import { parseAsInteger, useQueryState } from 'nuqs'
import { PropsWithChildren, useState, type ReactNode } from 'react'
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
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderIcon,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { GenericSkeletonLoader, ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { DeleteDestination } from './DeleteDestination'
import { DestinationLogo } from './DestinationLogo'
import { DestinationPanel } from './DestinationPanel/DestinationPanel'
import {
  getPipelineDisplayState,
  getPipelineLegacyLogsUrl,
  getPipelineUnifiedLogsUrl,
  getRestartRequestStatus,
  getStatusName,
} from './Pipeline.utils'
import { useUrlReplicationClusterId } from './PipelineClusterScope'
import { PipelineStatePill } from './PipelineStatePill'
import { PipelineStatusName } from './Replication.constants'
import {
  canModifyDestination,
  getReplicationDestinationType,
} from './ReplicationDiagram/Nodes.utils'
import { UnknownDestinationNotice } from './UnknownDestinationNotice'
import { UpdateVersionModal } from './UpdateVersionModal'
import { useReplicationClusters } from './useReplicationClusters'
import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { AlertError } from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { RegionFlag } from '@/components/ui/RegionFlag'
import { useDeleteDestinationPipelineMutation } from '@/data/replication/delete-destination-pipeline-mutation'
import { useReplicationDestinationByIdQuery } from '@/data/replication/destination-by-id-query'
import { useReplicationPipelineByIdQuery } from '@/data/replication/pipeline-by-id-query'
import { useReplicationPipelineStatusQuery } from '@/data/replication/pipeline-status-query'
import { useReplicationPipelineVersionQuery } from '@/data/replication/pipeline-version-query'
import { useRestartPipelineMutation } from '@/data/replication/restart-pipeline-mutation'
import { useStartPipelineMutation } from '@/data/replication/start-pipeline-mutation'
import { useStopPipelineMutation } from '@/data/replication/stop-pipeline-mutation'
import { DOCS_URL } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'
import { splitInternalUrl } from '@/lib/internal-url'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'

type LifecycleAction = 'start' | 'stop' | 'restart'

const LIFECYCLE_BY_STATUS: Partial<
  Record<PipelineStatusName, { label: string; action: LifecycleAction; icon: ReactNode }>
> = {
  [PipelineStatusName.STOPPED]: { label: 'Start', action: 'start', icon: <PlayIcon /> },
  [PipelineStatusName.STARTED]: { label: 'Stop', action: 'stop', icon: <CircleStopIcon /> },
  [PipelineStatusName.FAILED]: { label: 'Restart', action: 'restart', icon: <RotateCcwIcon /> },
}

export const ReplicationPipelineLayout = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate()
  const { ref: projectRef, pipelineId } = useParams()
  const clusterId = useUrlReplicationClusterId()
  const { clusters, hasMultipleRegions } = useReplicationClusters()
  const region = clusters.find(
    (cluster) => (cluster.isDefault ? undefined : cluster.clusterId) === clusterId
  )
  const { isEnabled: isUnifiedLogsEnabled } = useUnifiedLogsPreview()

  const [showUpdateVersionModal, setShowUpdateVersionModal] = useState(false)
  const [showDeleteDestination, setShowDeleteDestination] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [, setEdit] = useQueryState(
    'edit',
    parseAsInteger.withOptions({ history: 'push', clearOnDefault: true })
  )
  const { getRequestStatus, isRequestPending, runWithRequestStatus } = usePipelineRequestStatus({
    clusterId,
  })
  const requestStatus = getRequestStatus(pipelineId)
  const isPipelineRequestPending = isRequestPending(pipelineId)

  const {
    data: pipeline,
    error: pipelineError,
    isPending: isPipelineLoading,
  } = useReplicationPipelineByIdQuery(
    { projectRef, clusterId, pipelineId },
    { enabled: !!pipelineId }
  )
  const {
    data: pipelineStatusData,
    error: pipelineStatusError,
    isLoading: isPipelineStatusLoading,
    isError: isPipelineStatusError,
    isSuccess: isPipelineStatusSuccess,
  } = useReplicationPipelineStatusQuery(
    { projectRef, clusterId, pipelineId },
    { enabled: !!pipelineId }
  )
  const { data: versionData } = useReplicationPipelineVersionQuery({
    projectRef,
    clusterId,
    pipelineId: pipeline?.id,
  })
  const {
    data: destination,
    error: destinationError,
    isPending: isDestinationLoading,
  } = useReplicationDestinationByIdQuery({
    projectRef,
    clusterId,
    destinationId: pipeline?.destination_id,
  })

  const { mutateAsync: startPipeline, isPending: isStartingPipeline } = useStartPipelineMutation({
    onError: () => {},
  })
  const { mutateAsync: stopPipeline, isPending: isStoppingPipeline } = useStopPipelineMutation({
    onError: () => {},
  })
  const { mutateAsync: restartPipeline, isPending: isRestartingPipeline } =
    useRestartPipelineMutation()
  const { mutateAsync: deleteDestinationPipeline } = useDeleteDestinationPipelineMutation({
    onError: () => {},
  })

  const statusName = getStatusName(pipelineStatusData?.status)
  const displayState = getPipelineDisplayState(requestStatus, statusName)
  const destinationType = getReplicationDestinationType(destination?.config)
  const isUnknownDestination = destinationType === 'Unknown'
  const canModify = canModifyDestination(destinationType)
  const isPipelineIdentityLoading =
    isPipelineLoading || (pipeline !== undefined && isDestinationLoading)
  const hasUpdate = canModify && Boolean(versionData?.new_version)
  const isTransitioning = requestStatus !== PipelineStatusRequestStatus.None
  const isRunningOrFailed =
    statusName === PipelineStatusName.STARTED || statusName === PipelineStatusName.FAILED

  // What the primary button offers for each state it can act on. Anything not listed here (a
  // pipeline mid-transition, or one in an unknown state) has no action, so the button falls back
  // to the display state's own label and renders no icon.
  const lifecycle =
    isUnknownDestination && isRunningOrFailed
      ? LIFECYCLE_BY_STATUS[PipelineStatusName.STARTED]
      : LIFECYCLE_BY_STATUS[statusName as PipelineStatusName]
  const isActionable = lifecycle !== undefined
  const primaryAction: LifecycleAction | undefined = lifecycle?.action
  const canShowLifecycleAction = canModify || primaryAction === 'stop'
  const lifecycleLabel = isTransitioning
    ? displayState.label
    : (lifecycle?.label ?? displayState.label)
  // No icon while Starting/Stopping/Restarting: those states have no entry above, and the
  // button's loading state carries the transition anyway.
  const lifecycleIcon = lifecycle?.icon

  // The overflow menu carries the lifecycle actions the primary button isn't already offering,
  // so the detail page has the same reach as the row menu on the list without repeating itself.
  const canUseMenuActions =
    isRunningOrFailed && !isTransitioning && !isPipelineStatusError && !!pipeline
  const canRestart =
    canModify && canUseMenuActions && !isPipelineRequestPending && primaryAction !== 'restart'
  const canStop = canUseMenuActions && !isPipelineRequestPending && primaryAction !== 'stop'

  const onLifecycleAction = async (action?: LifecycleAction) => {
    const resolvedAction = action ?? primaryAction
    if (!projectRef || !pipeline || resolvedAction === undefined) return
    if (!canModify && resolvedAction !== 'stop') return

    try {
      if (resolvedAction === 'start') {
        await runWithRequestStatus(pipeline.id, PipelineStatusRequestStatus.StartRequested, () =>
          startPipeline({ projectRef, pipelineId: pipeline.id, clusterId })
        )
      } else if (resolvedAction === 'stop') {
        await runWithRequestStatus(pipeline.id, PipelineStatusRequestStatus.StopRequested, () =>
          stopPipeline({ projectRef, pipelineId: pipeline.id, clusterId })
        )
      } else {
        await runWithRequestStatus(pipeline.id, getRestartRequestStatus(statusName), () =>
          restartPipeline({ projectRef, pipelineId: pipeline.id, clusterId })
        )
      }
    } catch (error) {
      toast.error(`Failed to ${resolvedAction} pipeline: ${(error as StudioError).message}`)
    }
  }

  const onDeleteDestination = async () => {
    if (!projectRef || !pipeline) return

    const pipelineTarget = { projectRef, pipelineId: pipeline.id, clusterId }

    try {
      setIsDeleting(true)
      if (statusName !== PipelineStatusName.STOPPED) {
        await stopPipeline({ ...pipelineTarget, waitUntilStopped: true })
      }
      await deleteDestinationPipeline({
        ...pipelineTarget,
        destinationId: pipeline.destination_id,
      })
      setShowDeleteDestination(false)
      toast.success(`Deleted pipeline "${pipeline.destination_name}"`)
      void navigate({
        to: '/project/$ref/database/pipelines',
        params: { ref: projectRef },
      })
    } catch (error) {
      toast.error(`Failed to delete pipeline: ${(error as StudioError).message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const logsUrl = isUnifiedLogsEnabled
    ? getPipelineUnifiedLogsUrl({ projectRef: projectRef!, pipelineId })
    : getPipelineLegacyLogsUrl({ projectRef: projectRef!, pipelineId })

  return (
    <div className="flex min-h-full w-full flex-col items-stretch">
      <div className="bg-surface-75">
        <PageBreadcrumbs
          slotClassName="sticky top-0 z-20 bg-sidebar"
          actions={
            <PageBreadcrumbsActions>
              <DocsButton href={`${DOCS_URL}/guides/database/replication/pipelines`} />
              <Button asChild variant="default">
                <Link {...splitInternalUrl(logsUrl)}>View logs</Link>
              </Button>
            </PageBreadcrumbsActions>
          }
        >
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/project/$ref/database/pipelines" params={{ ref: projectRef ?? '_' }}>
                  Pipelines
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {isPipelineLoading ? (
                  <span className="inline-flex items-center">
                    <span className="sr-only">Loading pipeline</span>
                    <ShimmeringLoader className="h-5 w-24 py-0" />
                  </span>
                ) : (
                  (pipeline?.destination_name ?? 'Pipeline')
                )}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </PageBreadcrumbs>

        <PageHeader size="full" className="border-b py-4 [&>div]:px-4 [&>div]:xl:px-4">
          <PageHeaderMeta>
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
                  <span className="flex h-8 items-center">
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
                  <ArrowRightIcon size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                  {isPipelineIdentityLoading ? (
                    <span className="inline-flex items-center">
                      <span className="sr-only">Loading destination</span>
                      <ShimmeringLoader className="h-5 w-20 py-0" />
                    </span>
                  ) : (
                    <span>{destinationType ?? pipeline?.destination_name ?? 'Unknown'}</span>
                  )}
                </span>
                {hasMultipleRegions && region && (
                  <>
                    <span aria-hidden className="text-foreground-lighter">
                      &middot;
                    </span>
                    <span className="inline-flex items-center gap-1 text-foreground-light">
                      <span>Pipeline region:</span>
                      {region.regionCode && (
                        <RegionFlag className="w-4" region={region.regionCode} />
                      )}
                      <span>
                        {region.regionCode
                          ? `${region.regionName} (${region.regionCode})`
                          : region.regionName}
                      </span>
                    </span>
                  </>
                )}
              </PageHeaderDescription>
            </PageHeaderSummary>

            <PageHeaderAside>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {hasUpdate && (
                  <Button
                    variant="primary"
                    icon={<ArrowUpCircleIcon />}
                    onClick={() => setShowUpdateVersionModal(true)}
                    disabled={isPipelineRequestPending || isTransitioning}
                  >
                    Update available
                  </Button>
                )}
                {canShowLifecycleAction && (
                  <Button
                    variant={
                      !hasUpdate && statusName === PipelineStatusName.STOPPED
                        ? 'primary'
                        : 'default'
                    }
                    icon={lifecycleIcon}
                    onClick={() => onLifecycleAction()}
                    loading={
                      displayState.type === 'loading' ||
                      isTransitioning ||
                      isStartingPipeline ||
                      isStoppingPipeline ||
                      isRestartingPipeline
                    }
                    disabled={
                      Boolean(pipelineError) ||
                      isPipelineStatusError ||
                      !pipeline ||
                      isTransitioning ||
                      isPipelineRequestPending ||
                      !isActionable
                    }
                  >
                    {lifecycleLabel}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="default"
                      className="w-6.5 hit-area-1"
                      aria-label="Pipeline options"
                      icon={<MoreVerticalIcon />}
                      disabled={isPipelineRequestPending || isTransitioning}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="end" className="w-52">
                    {canRestart && (
                      <DropdownMenuItem
                        className="gap-x-2 items-start"
                        onClick={() => onLifecycleAction('restart')}
                        aria-label="Restart pipeline"
                        aria-description="Resume saved progress. Unfinished initial syncs start over."
                      >
                        <RotateCcwIcon size={14} className="mt-0.5 shrink-0" />
                        <div>
                          <span>Restart pipeline</span>
                          <p className="text-xs text-foreground-lighter">
                            Resume saved progress. Unfinished initial syncs start over.
                          </p>
                        </div>
                      </DropdownMenuItem>
                    )}
                    {canStop && (
                      <DropdownMenuItem
                        className="gap-x-2"
                        onClick={() => onLifecycleAction('stop')}
                      >
                        <CircleStopIcon size={14} />
                        <span>Stop pipeline</span>
                      </DropdownMenuItem>
                    )}
                    {(canRestart || canStop) && <DropdownMenuSeparator />}
                    {canModify && (
                      <DropdownMenuItem
                        className="gap-x-2"
                        disabled={pipeline === undefined}
                        onClick={() => {
                          if (pipeline !== undefined) setEdit(pipeline.destination_id)
                        }}
                      >
                        <EditIcon size={14} />
                        <span>Edit pipeline</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="gap-x-2"
                      disabled={pipeline === undefined}
                      onClick={() => setShowDeleteDestination(true)}
                    >
                      <TrashIcon size={14} />
                      <span>Delete pipeline</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </PageHeaderAside>
          </PageHeaderMeta>
        </PageHeader>
      </div>

      {isPipelineIdentityLoading && !pipelineError && (
        <PageContainer size="large">
          <GenericSkeletonLoader />
        </PageContainer>
      )}

      {isUnknownDestination && (
        <PageContainer size="large">
          <UnknownDestinationNotice />
        </PageContainer>
      )}

      {destinationError && (
        <PageContainer size="large">
          <AlertError
            error={destinationError}
            subject="Failed to retrieve destination information"
            projectRef={projectRef}
          />
        </PageContainer>
      )}

      {!isUnknownDestination && (canModify || pipelineError) && children}

      <DestinationPanel clusterId={clusterId} />

      <DeleteDestination
        visible={showDeleteDestination}
        setVisible={setShowDeleteDestination}
        onDelete={onDeleteDestination}
        isLoading={isDeleting}
        name={pipeline?.destination_name ?? ''}
      />

      <UpdateVersionModal
        visible={canModify && showUpdateVersionModal}
        clusterId={clusterId}
        pipeline={pipeline}
        onClose={() => setShowUpdateVersionModal(false)}
      />
    </div>
  )
}
