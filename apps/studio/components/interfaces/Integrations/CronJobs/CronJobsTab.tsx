import { Search } from 'lucide-react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'

import { CreateCronJobSheet } from 'components/interfaces/Integrations/CronJobs/CreateCronJobSheet'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { CronJob } from 'data/database-cron-jobs/database-cron-job-query'
import { useCronJobsInfiniteQuery } from 'data/database-cron-jobs/database-cron-jobs-infinite-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { Button, Input, Sheet, SheetContent } from 'ui'
import { useDebounce } from 'use-debounce'
import { CronJobCard } from './CronJobCard'
import { DeleteCronJob } from './DeleteCronJob'
import { LoadMoreCronJobs } from './load-more-cron-jobs'

const EMPTY_CRON_JOB = {
  jobname: '',
  schedule: '',
  active: true,
  command: '',
}

export const CronjobsTab = () => {
  const { project } = useProjectContext()
  const org = useSelectedOrganization()

  const [searchQuery, setSearchQuery] = useQueryState('search', parseAsString.withDefault(''))
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500)
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
    data: cronJobsPages,
    isLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
  } = useCronJobsInfiniteQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    searchTerm: debouncedSearchQuery,
  })

  const cronJobs =
    useMemo(() => cronJobsPages?.pages.map((p) => p.data).flat(), [cronJobsPages]) ?? []
  console.log(cronJobs)

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { mutate: sendEvent } = useSendEventMutation()

  // check pg_cron version to see if it supports seconds
  const pgCronExtension = (extensions ?? []).find((ext) => ext.name === 'pg_cron')
  const installedVersion = pgCronExtension?.installed_version
  const supportsSeconds = installedVersion ? parseFloat(installedVersion) >= 1.5 : false

  const onOpenCreateJobSheet = () => {
    sendEvent({
      action: 'cron_job_create_clicked',
      groups: { project: project?.ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
    })
    setCreateCronJobSheetShown(true)
  }

  return (
    <>
      <div className="w-full space-y-4 p-4 md:p-10">
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between flex-wrap">
            <Input
              placeholder="Search for a job"
              size="small"
              icon={<Search size={14} />}
              value={searchQuery || ''}
              className="w-64"
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Button onClick={onOpenCreateJobSheet}>Create job</Button>
          </div>
          {isLoading ? (
            <div className="p-10">
              <GenericSkeletonLoader />
            </div>
          ) : cronJobs.length === 0 ? (
            <div
              className={
                'border rounded border-default px-20 py-16 flex flex-col items-center justify-center space-y-4 border-dashed'
              }
            >
              <p className="text-sm text-foreground">No results found</p>
              <p className="text-sm text-foreground-light">
                Your search for "{debouncedSearchQuery}" did not return any results
              </p>
            </div>
          ) : isLoading ? (
            <div className="p-10">
              <GenericSkeletonLoader />
            </div>
          ) : (
            <>
              {cronJobs.map((job) => (
                <CronJobCard
                  key={job.jobid}
                  job={job}
                  onEditCronJob={(job) => {
                    setCronJobForEditing(job)
                    setCreateCronJobSheetShown(true)
                  }}
                  onDeleteCronJob={(job) => setCronJobForDeletion(job)}
                />
              ))}
              {hasNextPage && <LoadMoreCronJobs onVisible={fetchNextPage} isLoading={isFetching} />}
            </>
          )}
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
