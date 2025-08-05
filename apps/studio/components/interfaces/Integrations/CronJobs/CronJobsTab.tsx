import { Loader2, RefreshCw, Search, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { UIEvent, useMemo, useRef, useState } from 'react'
import DataGrid, { DataGridHandle, Row } from 'react-data-grid'

import { useParams } from 'common'
import { CreateCronJobSheet } from 'components/interfaces/Integrations/CronJobs/CreateCronJobSheet'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useCronJobsCountQuery } from 'data/database-cron-jobs/database-cron-jobs-count-query'
import {
  CronJob,
  useCronJobsInfiniteQuery,
} from 'data/database-cron-jobs/database-cron-jobs-infinite-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { isAtBottom } from 'lib/helpers'
import { Button, cn, LoadingLine, Sheet, SheetContent } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { formatCronJobColumns } from './CronJobs.utils'
import { DeleteCronJob } from './DeleteCronJob'

const EMPTY_CRON_JOB = { jobname: '', schedule: '', active: true, command: '' }

export const CronjobsTab = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { project } = useProjectContext()
  const { data: org } = useSelectedOrganizationQuery()

  const xScroll = useRef<number>(0)
  const gridRef = useRef<DataGridHandle>(null)

  const [searchQuery, setSearchQuery] = useQueryState('search', parseAsString.withDefault(''))
  const [search, setSearch] = useState(searchQuery)
  const [createCronJobSheetShown, setCreateCronJobSheetShown] = useQueryState(
    'dialog-shown',
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  )

  // used for confirmation prompt in the Create Cron Job Sheet
  const [isClosingCreateCronJobSheet, setIsClosingCreateCronJobSheet] = useState(false)
  const [cronJobForEditing, setCronJobForEditing] = useState<
    Pick<CronJob, 'jobname' | 'schedule' | 'active' | 'command'> | undefined
  >()
  const [cronJobForDeletion, setCronJobForDeletion] = useState<CronJob | undefined>()

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
    { keepPreviousData: Boolean(searchQuery), staleTime: Infinity }
  )
  const cronJobs = useMemo(() => data?.pages.flatMap((p) => p) || [], [data?.pages])

  const { data: count, isLoading: isLoadingCount } = useCronJobsCountQuery({
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
        setCreateCronJobSheetShown(true)
        setCronJobForEditing(job)
      },
      onSelectDelete: (job: CronJob) => {
        sendEvent({
          action: 'cron_job_delete_clicked',
          groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
        })
        setCronJobForDeletion(job)
      },
    })
  }, [org?.slug, ref, sendEvent, setCreateCronJobSheetShown])

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

  return (
    <>
      <div className="h-full w-full space-y-4">
        <div className="h-full w-full flex flex-col relative">
          <div className="bg-surface-200 py-3 px-10 flex items-center justify-between flex-wrap">
            <Input
              size="tiny"
              className="w-52"
              placeholder="Search for a job"
              icon={<Search size={14} />}
              value={search ?? ''}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.code === 'Enter') setSearchQuery(search.trim())
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
                        window.open(url, '_blank')
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

      <DeleteCronJob
        visible={!!cronJobForDeletion}
        onClose={() => setCronJobForDeletion(undefined)}
        cronJob={cronJobForDeletion!}
      />

      <Sheet
        open={!!createCronJobSheetShown}
        onOpenChange={() => setIsClosingCreateCronJobSheet(true)}
      >
        <SheetContent size="default" tabIndex={undefined}>
          <CreateCronJobSheet
            selectedCronJob={cronJobForEditing ?? EMPTY_CRON_JOB}
            supportsSeconds={supportsSeconds}
            onClose={() => {
              setIsClosingCreateCronJobSheet(false)
              setCronJobForEditing(undefined)
              setCreateCronJobSheetShown(false)
            }}
            isClosing={isClosingCreateCronJobSheet}
            setIsClosing={setIsClosingCreateCronJobSheet}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
