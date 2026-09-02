import { useParams } from 'common'
import {
  ArrowRight,
  ArrowUpCircle,
  Ban,
  Edit,
  MoreVertical,
  Pause,
  Play,
  RotateCcw,
  Trash,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsInteger, useQueryState } from 'nuqs'
import { PropsWithChildren, useEffect, useState } from 'react'
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
  NavMenu,
  NavMenuItem,
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
import { PageNav } from 'ui-patterns/PageNav'

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

  const { data: pipeline, error: pipelineError } = useReplicationPipelineByIdQuery({
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
  const { data: destination } = useReplicationDestinationByIdQuery({
    projectRef,
    destinationId: pipeline?.destination_id,
  })

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
  const hasUpdate = Boolean(versionData?.new_version)
  const isTransitioning = requestStatus !== PipelineStatusRequestStatus.None
  const isActionable = PIPELINE_ACTIONABLE_STATES.includes(statusName as PipelineStatusName)

  const lifecycleLabel = isTransitioning
    ? displayState.label
    : statusName === PipelineStatusName.STOPPED
      ? 'Start'
      : statusName === PipelineStatusName.STARTED
        ? 'Stop'
        : statusName === PipelineStatusName.FAILED
          ? 'Restart'
          : displayState.label

  const lifecycleIcon =
    statusName === PipelineStatusName.STOPPED ? (
      <Play />
    ) : statusName === PipelineStatusName.STARTED ? (
      <Pause />
    ) : statusName === PipelineStatusName.FAILED ? (
      <RotateCcw />
    ) : (
      <Ban />
    )

  const primaryAction: LifecycleAction | undefined =
    statusName === PipelineStatusName.STOPPED
      ? 'start'
      : statusName === PipelineStatusName.STARTED
        ? 'stop'
        : statusName === PipelineStatusName.FAILED
          ? 'restart'
          : undefined

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

  const overviewUrl = `/project/${projectRef}/database/replication/${pipelineId}`
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
              <BreadcrumbPage>{pipeline?.destination_name ?? 'Pipeline'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </PageBreadcrumbs>

        <PageHeader size="full" className="py-4 [&>div]:px-4 [&>div]:xl:px-4">
          <PageHeaderMeta className="px-0 xl:px-0">
            {destinationType !== undefined && (
              <PageHeaderIcon>
                <DestinationLogo type={destinationType} size="large" />
              </PageHeaderIcon>
            )}
            <PageHeaderSummary>
              <PageHeaderTitle>{pipeline?.destination_name ?? 'Pipeline'}</PageHeaderTitle>
              <PageHeaderDescription className="flex flex-row flex-wrap items-center gap-x-1.5 gap-y-1 text-sm!">
                <PipelineStatePill
                  pipelineStatus={pipelineStatusData?.status}
                  error={pipelineStatusError}
                  isLoading={isPipelineStatusLoading}
                  isError={isPipelineStatusError}
                  isSuccess={isPipelineStatusSuccess}
                  requestStatus={requestStatus}
                  projectRef={projectRef}
                  pipelineId={pipelineId}
                />
                {pipeline !== undefined && (
                  <>
                    <span aria-hidden className="text-foreground-lighter">
                      &middot;
                    </span>
                    <span className="flex items-center gap-x-1.5 text-foreground-light">
                      <span>Primary database</span>
                      <ArrowRight size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                      <span>{destinationType ?? pipeline.destination_name}</span>
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
                  className="capitalize"
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
                      className="px-1.5"
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
                        <Pause size={14} />
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

        <PageNav>
          <NavMenu>
            <NavMenuItem active>
              <Link href={overviewUrl}>Overview</Link>
            </NavMenuItem>
          </NavMenu>
        </PageNav>
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
