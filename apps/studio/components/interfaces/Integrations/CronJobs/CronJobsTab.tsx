import { Loader2, RefreshCw, Search, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { UIEvent, useMemo, useRef, useState } from 'react'
import DataGrid, { DataGridHandle, Row } from 'react-data-grid'
import { toast } from 'sonner'

import { keepPreviousData } from '@tanstack/react-query'
import { useParams } from 'common'
import { CreateCronJobSheet } from 'components/interfaces/Integrations/CronJobs/CreateCronJobSheet/CreateCronJobSheet'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useCronJobsCountQuery } from 'data/database-cron-jobs/database-cron-jobs-count-query'
import {
  CronJob,
  useCronJobsInfiniteQuery,
} from 'data/database-cron-jobs/database-cron-jobs-infinite-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { handleErrorOnDelete, useQueryStateWithSelect } from 'hooks/misc/useQueryStateWithSelect'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useConfirmOnClose, type ConfirmOnCloseModalProps } from 'hooks/ui/useConfirmOnClose'
import { BASE_PATH } from 'lib/constants'
import { cleanPointerEventsNoneOnBody, isAtBottom } from 'lib/helpers'
import { Button, cn, LoadingLine, Sheet, SheetContent } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { formatCronJobColumns } from './CronJobs.utils'
import { DeleteCronJob } from './DeleteCronJob'

const EMPTY_CRON_JOB = { jobname: '', schedule: '', active: true, command: '' }

export const CronjobsTab = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()

  const xScroll = useRef<number>(0)
  const gridRef = useRef<DataGridHandle>(null)

  // Track the ID being deleted to exclude it from error checking
  const deletingCronJobIdRef = useRef<string | null>(null)

  const [searchQuery, setSearchQuery] = useQueryState('search', parseAsString.withDefault(''))
  const [search, setSearch] = useState(searchQuery)
  const [createCronJobSheetShown, setCreateCronJobSheetShown] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  )

  const {
    data,
    error,
    isLoading,
    isError,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    fetchNextPage,
  } = useCronJobsInfiniteQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      searchTerm: searchQuery,
    },
    { placeholderData: Boolean(searchQuery) ? keepPreviousData : undefined, staleTime: Infinity }
  )
  const cronJobs = useMemo(() => data?.pages.flatMap((p) => p) || [], [data?.pages])

  const { setValue: setCronJobForEditing, value: cronJobForEditing } = useQueryStateWithSelect({
    urlKey: 'edit',
    select: (jobid: string) => {
      if (!jobid) return undefined
      const job = cronJobs?.find((j) => j.jobid.toString() === jobid)
      return job
        ? { jobname: job.jobname, schedule: job.schedule, active: job.active, command: job.command }
        : undefined
    },
    enabled: !!cronJobs && cronJobs.length > 0 && !isLoading,
    onError: () => toast.error(`Cron job not found`),
  })

  const { setValue: setCronJobForDeletion, value: cronJobForDeletion } = useQueryStateWithSelect({
    urlKey: 'delete',
    select: (jobid: string) =>
      jobid ? cronJobs?.find((j) => j.jobid.toString() === jobid) : undefined,
    enabled: !!cronJobs && cronJobs.length > 0 && !isLoading,
    onError: (_error, selectedId) =>
      handleErrorOnDelete(deletingCronJobIdRef, selectedId, `Cron job not found`),
  })

  const { data: count, isPending: isLoadingCount } = useCronJobsCountQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data: extensions = [] } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { mutate: sendEvent } = useSendEventMutation()

  const columns = useMemo(() => {
    return formatCronJobColumns({
      onSelectEdit: (job: any) => {
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
    })
  }, [org?.slug, ref, sendEvent, setCronJobForEditing, setCronJobForDeletion])

  // check pg_cron version to see if it supports seconds
  const pgCronExtension = extensions.find((ext) => ext.name === 'pg_cron')
  const installedVersion = pgCronExtension?.installed_version
  const supportsSeconds = installedVersion ? parseFloat(installedVersion) >= 1.5 : false

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const isScrollingHorizontally = xScroll.current !== event.currentTarget.scrollLeft
    xScroll.current = event.currentTarget.scrollLeft

    if (
      isLoading ||
      isFetchingNextPage ||
      isScrollingHorizontally ||
      !isAtBottom(event) ||
      !hasNextPage
    ) {
      return
    }

    fetchNextPage()
  }

  const onOpenCreateJobSheet = () => {
    sendEvent({
      action: 'cron_job_create_clicked',
      groups: { project: project?.ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
    })
    setCreateCronJobSheetShown(true)
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
          <div className="bg-surface-200 py-3 px-10 flex items-center justify-between flex-wrap">
            <Input
              size="tiny"
              className="w-52"
              placeholder="Search for a job"
              icon={<Search />}
              value={search ?? ''}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.code === 'Enter' || e.code === 'NumpadEnter') setSearchQuery(search.trim())
              }}
              actions={[
                search && (
                  <Button
                    size="tiny"
                    type="text"
                    icon={<X />}
                    onClick={() => {
                      setSearch('')
                      setSearchQuery(null)
                    }}
                    className="p-0 h-5 w-5"
                  />
                ),
              ]}
            />

            <div className="flex items-center gap-x-2">
              <Button
                type="default"
                icon={<RefreshCw />}
                loading={isRefetching && !isFetchingNextPage}
                onClick={() => refetch()}
              >
                Refresh
              </Button>
              <Button onClick={onOpenCreateJobSheet}>Create job</Button>
            </div>
          </div>

          <LoadingLine loading={isLoading || isRefetching || isFetchingNextPage} />

          <DataGrid
            ref={gridRef}
            className="flex-grow border-t-0"
            rowHeight={44}
            headerRowHeight={36}
            columns={columns}
            rows={cronJobs}
            rowKeyGetter={(row) => row.id}
            rowClass={() => {
              return cn(
                'cursor-pointer',
                '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
                '[&>.rdg-cell:first-child>div]:ml-8'
              )
            }}
            onScroll={handleScroll}
            renderers={{
              renderRow(_, props) {
                return (
                  <Row
                    key={props.row.jobid}
                    {...props}
                    onClick={(e) => {
                      const { jobid, jobname } = props.row
                      const url = `/project/${ref}/integrations/cron/jobs/${jobid}?child-label=${encodeURIComponent(jobname || `Job #${jobid}`)}`

                      sendEvent({
                        action: 'cron_job_history_clicked',
                        groups: {
                          project: ref ?? 'Unknown',
                          organization: org?.slug ?? 'Unknown',
                        },
                      })

                      if (e.metaKey) {
                        window.open(`${BASE_PATH}/${url}`, '_blank')
                      } else {
                        router.push(url)
                      }
                    }}
                  />
                )
              },
            }}
          />

          {/* [Joshen] Render 0 rows state outside of the grid so that their position isn't relative to the grid scroll position */}
          {cronJobs.length === 0 ? (
            isLoading ? (
              <div className="absolute top-28 px-10 w-full">
                <GenericSkeletonLoader />
              </div>
            ) : isError ? (
              <div className="absolute top-28 px-10 flex flex-col items-center justify-center w-full">
                <AlertError subject="Failed to retrieve cron jobs" error={error} />
              </div>
            ) : (
              <div className="absolute top-32 px-6 w-full">
                <div className="text-center text-sm flex flex-col gap-y-1">
                  <p className="text-foreground">
                    {!!searchQuery ? 'No cron jobs found' : 'No cron jobs in your project'}
                  </p>
                  <p className="text-foreground-light">
                    {!!searchQuery
                      ? 'There are currently no cron jobs based on the search applied'
                      : 'There are currently no cron jobs created yet in your project'}
                  </p>
                </div>
              </div>
            )
          ) : null}

          <div className="flex justify-between min-h-9 h-9 overflow-hidden items-center px-6 w-full border-t text-xs text-foreground-light">
            {isLoadingCount ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Loading...
              </span>
            ) : (
              `Total: ${count} jobs`
            )}
          </div>
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
