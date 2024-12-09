import { Search } from 'lucide-react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'

import { CreateCronJobSheet } from 'components/interfaces/Integrations/CronJobs/CreateCronJobSheet'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { CronJob, useCronJobsQuery } from 'data/database-cron-jobs/database-cron-jobs-query'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { TELEMETRY_EVENTS, TELEMETRY_VALUES } from 'lib/constants/telemetry'
import { Button, Input, Sheet, SheetContent } from 'ui'
import { CronJobCard } from './CronJobCard'
import { DeleteCronJob } from './DeleteCronJob'

const EMPTY_CRON_JOB = {
  jobname: '',
  schedule: '',
  active: true,
  command: '',
}

export const CronjobsTab = () => {
  const { project } = useProjectContext()

  const [searchQuery, setSearchQuery] = useQueryState('search', parseAsString.withDefault(''))
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

  const { data: cronJobs, isLoading } = useCronJobsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const { mutate: sendEvent } = useSendEventMutation()

  // check pg_cron version to see if it supports seconds
  const pgCronExtension = (extensions ?? []).find((ext) => ext.name === 'pg_cron')
  const installedVersion = pgCronExtension?.installed_version
  const supportsSeconds = installedVersion ? parseFloat(installedVersion) >= 1.5 : false

  if (isLoading)
    return (
      <div className="p-10">
        <GenericSkeletonLoader />
      </div>
    )

  const filteredCronJobs = (cronJobs ?? []).filter((cj) => cj?.jobname?.includes(searchQuery || ''))

  const onOpenCreateJobSheet = () => {
    sendEvent({
      action: TELEMETRY_EVENTS.CRON_JOBS,
      value: TELEMETRY_VALUES.CRON_JOB_CREATE_CLICKED,
      label: 'User clicked create job',
    })
    setCreateCronJobSheetShown(true)
  }

  return (
    <>
      <div className="w-full space-y-4 p-10">
        {(cronJobs ?? []).length == 0 ? (
          <div className="border rounded border-default px-20 py-16 flex flex-col items-center justify-center space-y-4 border-dashed">
            <p className="text-sm text-foreground">No cron jobs created yet</p>
            <Button onClick={onOpenCreateJobSheet}>Create job</Button>
          </div>
        ) : (
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
            {filteredCronJobs.length === 0 ? (
              <div
                className={
                  'border rounded border-default px-20 py-16 flex flex-col items-center justify-center space-y-4 border-dashed'
                }
              >
                <p className="text-sm text-foreground">No results found</p>
                <p className="text-sm text-foreground-light">
                  Your search for "{searchQuery}" did not return any results
                </p>
              </div>
            ) : isLoading ? (
              <div className="p-10">
                <GenericSkeletonLoader />
              </div>
            ) : (
              filteredCronJobs.map((job) => (
                <CronJobCard
                  key={job.jobid}
                  job={job}
                  onEditCronJob={(job) => {
                    setCronJobForEditing(job)
                    setCreateCronJobSheetShown(true)
                  }}
                  onDeleteCronJob={(job) => setCronJobForDeletion(job)}
                />
              ))
            )}
          </div>
        )}
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
