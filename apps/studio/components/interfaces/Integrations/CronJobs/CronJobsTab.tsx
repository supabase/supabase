import { useParams } from 'common'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { MouseEvent, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { LoadingLine } from 'ui'

import { formatCronJobColumns } from './CronJobs.utils'
import { CronJobRunDetailsOverflowNotice } from './CronJobsTab.CleanupNotice'
import { CronJobsTabDataGrid } from './CronJobsTab.DataGrid'
import { CronJobsTabHeader } from './CronJobsTab.Header'
import { useCronJobsData } from './CronJobsTab.useCronJobsData'
import { DeleteCronJob } from './DeleteCronJob'
import { CreateCronJobSheet } from '@/components/interfaces/Integrations/CronJobs/CreateCronJobSheet/CreateCronJobSheet'
import { CronJob } from '@/data/database-cron-jobs/database-cron-jobs-infinite-query'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useInfiniteScroll } from '@/hooks/misc/useInfiniteScroll'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { cleanPointerEventsNoneOnBody } from '@/lib/helpers'
import { createNavigationHandler } from '@/lib/navigation'
import { isGreaterThanOrEqual } from '@/lib/semver'

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

  const { grid, count } = useCronJobsData({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    searchQuery,
  })

  const [createCronJobSheetShown, setCreateCronJobSheetShown] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ clearOnDefault: true })
  )

  const [cronJobIdForEditing, setCronJobForEditing] = useQueryState('edit', parseAsString)
  const cronJobForEditing = grid.rows.find((j) => j.jobid.toString() === cronJobIdForEditing)

  const [, setCronJobForDeletion] = useQueryState('delete', parseAsString)

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

  const handleScroll = useInfiniteScroll({
    isLoading: grid.isLoading,
    isFetchingNextPage: grid.isFetchingNextPage,
    hasNextPage: grid.hasNextPage,
    fetchNextPage: grid.fetchNextPage,
  })

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

  const onClose = () => {
    setCronJobForEditing(null)
    setCreateCronJobSheetShown(false)
    cleanPointerEventsNoneOnBody(500)
  }

  useEffect(() => {
    if (grid.isSuccess && !!cronJobIdForEditing && !cronJobForEditing) {
      toast('Cron job not found')
      setCronJobForEditing(null)
    }
  }, [cronJobForEditing, cronJobIdForEditing, grid.isSuccess, setCronJobForEditing])

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
          {grid.isMinimal && (
            <CronJobRunDetailsOverflowNotice
              queryCost={grid.queryCost}
              refetchJobs={grid.refetch}
            />
          )}
          <CronJobsTabDataGrid
            columns={columns}
            rows={grid.rows}
            isLoading={grid.isLoading}
            error={grid.error}
            searchQuery={searchQuery}
            onScroll={handleScroll}
            onRowClick={handleRowClick}
          />
          <CronJobsFooter count={count} />
        </div>
      </div>

      <DeleteCronJob />

      <CreateCronJobSheet
        open={!!createCronJobSheetShown || !!cronJobForEditing}
        selectedCronJob={cronJobForEditing ?? EMPTY_CRON_JOB}
        onClose={onClose}
      />
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
