import { useParams } from 'common'
import { ArrowUpCircle, Ban, Pause, Play, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  Button,
  NavMenu,
  NavMenuItem,
} from 'ui'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderBreadcrumb,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderNavigationTabs,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { getPipelineDisplayState, getStatusName, PIPELINE_ACTIONABLE_STATES } from './Pipeline.utils'
import { PipelineStatus } from './PipelineStatus'
import { PipelineStatusName, STATUS_REFRESH_FREQUENCY_MS } from './Replication.constants'
import { UpdateVersionModal } from './UpdateVersionModal'
import { useReplicationPipelineByIdQuery } from '@/data/replication/pipeline-by-id-query'
import { useReplicationPipelineStatusQuery } from '@/data/replication/pipeline-status-query'
import { useReplicationPipelineVersionQuery } from '@/data/replication/pipeline-version-query'
import { useRestartPipelineMutation } from '@/data/replication/restart-pipeline-mutation'
import { useStartPipelineMutation } from '@/data/replication/start-pipeline-mutation'
import { useStopPipelineMutation } from '@/data/replication/stop-pipeline-mutation'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'
import { type ResponseError } from '@/types'

export const ReplicationPipelineLayout = ({ children }: PropsWithChildren) => {
  const router = useRouter()
  const { ref: projectRef, pipelineId: pipelineIdParam } = useParams()
  const pipelineId = Number(pipelineIdParam)
  const [showUpdateVersionModal, setShowUpdateVersionModal] = useState(false)
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

  const { mutateAsync: startPipeline, isPending: isStartingPipeline } =
    useStartPipelineMutation()
  const { mutateAsync: stopPipeline, isPending: isStoppingPipeline } = useStopPipelineMutation()
  const { mutateAsync: restartPipeline, isPending: isRestartingPipeline } =
    useRestartPipelineMutation()

  const statusName = getStatusName(pipelineStatusData?.status)
  const displayState = getPipelineDisplayState(requestStatus, statusName)
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

  const onLifecycleAction = async () => {
    if (!projectRef || !pipeline) return

    const action =
      statusName === PipelineStatusName.STOPPED
        ? 'start'
        : statusName === PipelineStatusName.STARTED
          ? 'stop'
          : 'restart'

    try {
      if (statusName === PipelineStatusName.STOPPED) {
        setRequestStatus(pipeline.id, PipelineStatusRequestStatus.StartRequested, statusName)
        await startPipeline({ projectRef, pipelineId: pipeline.id })
      } else if (statusName === PipelineStatusName.STARTED) {
        setRequestStatus(pipeline.id, PipelineStatusRequestStatus.StopRequested, statusName)
        await stopPipeline({ projectRef, pipelineId: pipeline.id })
      } else if (statusName === PipelineStatusName.FAILED) {
        setRequestStatus(pipeline.id, PipelineStatusRequestStatus.RestartRequested, statusName)
        await restartPipeline({ projectRef, pipelineId: pipeline.id })
      }
    } catch (error) {
      setRequestStatus(pipeline.id, PipelineStatusRequestStatus.None)
      toast.error(`Failed to ${action} pipeline: ${(error as ResponseError).message}`)
    }
  }

  useEffect(() => {
    updatePipelineStatus(pipelineId, statusName)
  }, [pipelineId, statusName, updatePipelineStatus])

  const overviewUrl = `/project/${projectRef}/database/replication/${pipelineId}`
  const settingsUrl = `${overviewUrl}/settings`
  const logsUrl = `/project/${projectRef}/logs/replication-logs?f=${encodeURIComponent(
    JSON.stringify({ pipeline_id: pipelineId })
  )}`
  const currentPath = router.asPath.split('?')[0]

  return (
    <div className="flex min-h-full w-full flex-col items-stretch">
      <PageHeader size="full" className="sticky top-0 z-10 bg-surface-75">
        <PageHeaderBreadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/project/${projectRef}/database/replication`}>Replication</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{pipeline?.destination_name ?? 'Pipeline'}</BreadcrumbItem>
          </BreadcrumbList>
        </PageHeaderBreadcrumb>

        <PageHeaderMeta>
          <PageHeaderSummary>
            <div className="flex flex-wrap items-center gap-3">
              <PageHeaderTitle>{pipeline?.destination_name ?? 'Pipeline'}</PageHeaderTitle>
              <PipelineStatus
                pipelineStatus={pipelineStatusData?.status}
                error={pipelineStatusError}
                isLoading={isPipelineStatusLoading}
                isError={isPipelineStatusError}
                isSuccess={isPipelineStatusSuccess}
                requestStatus={requestStatus}
                pipelineId={pipelineId}
              />
            </div>
            {pipeline !== undefined && (
              <PageHeaderDescription>
                From {pipeline.source_name} using {pipeline.config.publication_name}
              </PageHeaderDescription>
            )}
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
              <Button asChild variant="default">
                <Link href={logsUrl}>View logs</Link>
              </Button>
              <Button
                variant={!hasUpdate && statusName === PipelineStatusName.STOPPED ? 'primary' : 'default'}
                icon={lifecycleIcon}
                className="capitalize"
                onClick={onLifecycleAction}
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
            </div>
          </PageHeaderAside>
        </PageHeaderMeta>

        <PageHeaderNavigationTabs>
          <NavMenu>
            <NavMenuItem active={currentPath === overviewUrl}>
              <Link href={overviewUrl}>Overview</Link>
            </NavMenuItem>
            <NavMenuItem active={currentPath === settingsUrl}>
              <Link href={settingsUrl}>Settings</Link>
            </NavMenuItem>
          </NavMenu>
        </PageHeaderNavigationTabs>
      </PageHeader>

      {children}

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
