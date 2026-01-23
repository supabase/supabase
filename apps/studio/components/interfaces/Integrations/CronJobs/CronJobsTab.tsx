import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { MouseEvent, UIEvent, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { CreateCronJobSheet } from 'components/interfaces/Integrations/CronJobs/CreateCronJobSheet/CreateCronJobSheet'
import { CronJob } from 'data/database-cron-jobs/database-cron-jobs-infinite-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { handleErrorOnDelete, useQueryStateWithSelect } from 'hooks/misc/useQueryStateWithSelect'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useConfirmOnClose, type ConfirmOnCloseModalProps } from 'hooks/ui/useConfirmOnClose'
import { createNavigationHandler } from 'lib/navigation'
import { isGreaterThanOrEqual } from 'lib/semver'
import { cleanPointerEventsNoneOnBody, isAtBottom } from 'lib/helpers'
import { LoadingLine, Sheet, SheetContent } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { formatCronJobColumns } from './CronJobs.utils'
import { CronJobRunDetailsOverflowNotice } from './CronJobsTab.CleanupNotice'
import { CronJobsTabDataGrid } from './CronJobsTab.DataGrid'
import { CronJobRunDetailsEstimateErrorNotice } from './CronJobsTab.EstimateErrorNotice'
import { CronJobsTabHeader } from './CronJobsTab.Header'
import { useCronJobsCleanupActions } from './CronJobsTab.useCleanupActions'
import { useCronJobsData } from './CronJobsTab.useCronJobsData'
import { DeleteCronJob } from './DeleteCronJob'

const EMPTY_CRON_JOB = { jobname: '', schedule: '', active: true, command: '' }

export const CronjobsTab = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()

  const [searchQuery, setSearchQuery] = useQueryState('search', parseAsString.withDefault(''))
  const [search, setSearch] = useState(searchQuery)

  const handleSearchSubmit = () => {
    const trimmed = search.trim()
    setSearchQuery(trimmed.length > 0 ? trimmed : null)
  }
  const handleClearSearch = () => {
    setSearch('')
    setSearchQuery(null)
  }

  const { dataStatus, isQueryEnabled, grid, count } = useCronJobsData({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    searchQuery,
  })

  const {
    cleanupInterval,
    setCleanupInterval,
    cleanupState,
    runBatchedDeletion,
    scheduleCleanup,
    cancelDeletion,
  } = useCronJobsCleanupActions({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const gridOverlay = useMemo(() => {
    switch (dataStatus.status) {
      case 'overflow-confirmed':
        return (
          <CronJobRunDetailsOverflowNotice
            mode="confirmed"
            estimatedRows={dataStatus.estimatedRows}
            selectedInterval={cleanupInterval}
            onIntervalChange={setCleanupInterval}
            cleanupState={cleanupState}
            onRunDeleteSql={() => runBatchedDeletion(cleanupInterval)}
            onRunScheduleSql={() => scheduleCleanup(cleanupInterval)}
            onCancelDeletion={cancelDeletion}
            onRetryDeletion={() => runBatchedDeletion(cleanupInterval)}
            onRefresh={grid.refetch}
          />
        )

      case 'overflow-suspected':
        return (
          <CronJobRunDetailsOverflowNotice
            mode="suspected"
            estimatedRows={dataStatus.estimatedRows}
            selectedInterval={cleanupInterval}
            onIntervalChange={setCleanupInterval}
            cleanupState={cleanupState}
            onRunDeleteSql={() => runBatchedDeletion(cleanupInterval)}
            onRunScheduleSql={() => scheduleCleanup(cleanupInterval)}
            onCancelDeletion={cancelDeletion}
            onRetryDeletion={() => runBatchedDeletion(cleanupInterval)}
            onRefresh={grid.refetch}
          />
        )

      case 'estimate-error':
        return (
          <CronJobRunDetailsEstimateErrorNotice
            error={dataStatus.error}
            isRetrying={dataStatus.isRetrying}
            onRetry={dataStatus.retry}
          />
        )

      case 'loading':
      case 'ready':
      default:
        return undefined
    }
  }, [
    dataStatus,
    cleanupInterval,
    setCleanupInterval,
    cleanupState,
    runBatchedDeletion,
    scheduleCleanup,
    cancelDeletion,
    grid.refetch,
  ])

  const deletingCronJobIdRef = useRef<string | null>(null)

  const { setValue: setCronJobForEditing, value: cronJobForEditing } = useQueryStateWithSelect({
    urlKey: 'edit',
    select: (jobid: string) => {
      if (!jobid) return undefined
      const job = grid.rows.find((j) => j.jobid.toString() === jobid)
      return job
        ? { jobname: job.jobname, schedule: job.schedule, active: job.active, command: job.command }
        : undefined
    },
    enabled: grid.rows.length > 0 && !grid.isLoading,
    onError: () => toast.error(`Cron job not found`),
  })

  const { setValue: setCronJobForDeletion, value: cronJobForDeletion } = useQueryStateWithSelect({
    urlKey: 'delete',
    select: (jobid: string) =>
      jobid ? grid.rows.find((j) => j.jobid.toString() === jobid) : undefined,
    enabled: grid.rows.length > 0 && !grid.isLoading,
    onError: (_error, selectedId) =>
      handleErrorOnDelete(deletingCronJobIdRef, selectedId, `Cron job not found`),
  })

  const { data: extensions = [] } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const pgCronExtension = extensions.find((ext) => ext.name === 'pg_cron')
  const supportsSeconds = pgCronExtension?.installed_version
    ? isGreaterThanOrEqual(pgCronExtension.installed_version, '1.5')
    : false

  const { mutate: sendEvent } = useSendEventMutation()

  const columns = useMemo(
    () =>
      formatCronJobColumns({
        onSelectEdit: (job: CronJob) => {
          sendEvent({
            action: 'cron_job_update_clicked',
            groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
          })
          setCronJobForEditing(job.jobid.toString())
        },
        onSelectDelete: (job: CronJob) => {
          sendEvent({
            action: 'cron_job_delete_clicked',
            groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
          })
          setCronJobForDeletion(job.jobid.toString())
        },
      }),
    [org?.slug, ref, sendEvent, setCronJobForEditing, setCronJobForDeletion]
  )

  const xScroll = useRef<number>(0)

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!isQueryEnabled) return

    const isScrollingHorizontally = xScroll.current !== event.currentTarget.scrollLeft
    xScroll.current = event.currentTarget.scrollLeft

    if (
      grid.isLoading ||
      grid.isFetchingNextPage ||
      isScrollingHorizontally ||
      !isAtBottom(event) ||
      !grid.hasNextPage
    ) {
      return
    }

    grid.fetchNextPage()
  }

  // Create job sheet
  const [createCronJobSheetShown, setCreateCronJobSheetShown] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  )

  const onOpenCreateJobSheet = () => {
    sendEvent({
      action: 'cron_job_create_clicked',
      groups: { project: project?.ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
    })
    setCreateCronJobSheetShown(true)
  }

  // Row click handler
  const handleRowClick = (row: CronJob, event: MouseEvent<HTMLDivElement>) => {
    const { jobid, jobname } = row
    const url = `/project/${ref}/integrations/cron/jobs/${jobid}?child-label=${encodeURIComponent(
      jobname || `Job #${jobid}`
    )}`

    sendEvent({
      action: 'cron_job_history_clicked',
      groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
    })

    createNavigationHandler(url, router)(event)
  }

  const [isDirty, setIsDirty] = useState(false)
  const onClose = () => {
    setCronJobForEditing(null)
    setCreateCronJobSheetShown(false)
    cleanPointerEventsNoneOnBody(500)
  }
  const { confirmOnClose, modalProps: closeConfirmationModalProps } = useConfirmOnClose({
    checkIsDirty: () => isDirty,
    onClose: () => {
      setIsDirty(false)
      onClose()
    },
  })

  return (
    <>
      <div className="h-full w-full space-y-4">
        <div className="h-full w-full flex flex-col relative">
          <CronJobsTabHeader
            search={search}
            isRefreshing={grid.isRefetching && !grid.isFetchingNextPage}
            onSearchChange={setSearch}
            onSearchSubmit={handleSearchSubmit}
            onClearSearch={handleClearSearch}
            onRefresh={grid.refetch}
            onCreateJob={onOpenCreateJobSheet}
          />
          <LoadingLine loading={grid.isLoading || grid.isRefetching || grid.isFetchingNextPage} />
          <CronJobsTabDataGrid
            columns={columns}
            rows={grid.rows}
            isLoading={grid.isLoading}
            error={grid.error}
            searchQuery={searchQuery}
            onScroll={handleScroll}
            onRowClick={handleRowClick}
            overlay={gridOverlay}
          />
          <CronJobsFooter count={count} />
        </div>
      </div>

      {cronJobForDeletion && (
        <DeleteCronJob
          visible={!!cronJobForDeletion}
          onClose={() => {
            deletingCronJobIdRef.current = null
            setCronJobForDeletion(null)
          }}
          onDeleteStart={(jobId) => {
            deletingCronJobIdRef.current = jobId
          }}
          cronJob={cronJobForDeletion}
        />
      )}

      <Sheet open={!!createCronJobSheetShown || !!cronJobForEditing} onOpenChange={confirmOnClose}>
        <SheetContent size="default" tabIndex={undefined}>
          <CreateCronJobSheet
            selectedCronJob={cronJobForEditing ?? EMPTY_CRON_JOB}
            supportsSeconds={supportsSeconds}
            onDirty={setIsDirty}
            onClose={onClose}
            onCloseWithConfirmation={confirmOnClose}
          />
        </SheetContent>
      </Sheet>
      <CloseConfirmationModal {...closeConfirmationModalProps} />
    </>
  )
}

// Footer component for displaying job count
interface CronJobsFooterProps {
  count: {
    value: number | undefined
    isEstimate: boolean
    isLoading: boolean
  }
}

const CronJobsFooter = ({ count }: CronJobsFooterProps) => (
  <div className="flex justify-between min-h-9 h-9 overflow-hidden items-center px-6 w-full border-t text-xs text-foreground-light">
    {count.isLoading ? (
      <span className="flex items-center gap-2">
        <Loader2 size={14} className="animate-spin" /> Loading...
      </span>
    ) : (
      `Total: ${count.value ?? 0} jobs${count.isEstimate ? ' (estimate)' : ''}`
    )}
  </div>
)

// Confirmation modal for unsaved changes
const CloseConfirmationModal = ({ visible, onClose, onCancel }: ConfirmOnCloseModalProps) => (
  <ConfirmationModal
    visible={visible}
    title="Discard changes"
    confirmLabel="Discard"
    onCancel={onCancel}
    onConfirm={onClose}
  >
    <p className="text-sm text-foreground-light">
      There are unsaved changes. Are you sure you want to close the panel? Your changes will be
      lost.
    </p>
  </ConfirmationModal>
)
