import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { CronJob, useCronJobsQuery } from 'data/database-cron-jobs/database-cron-jobs-query'

import { CronJobCard } from './CronJobCard'
import DeleteCronJob from './DeleteCronJob'
import { Sheet, SheetContent } from 'ui'
import { CreateCronJobSheet } from 'components/interfaces/Integrations/CronJobs/CreateCronJobSheet'

export const CronJobsListing = () => {
  const { project } = useProjectContext()

  // used for confirmation prompt in the Create Cron Job Sheet
  const [isClosingCreateCronJobSheet, setIsClosingCreateCronJobSheet] = useState(false)
  const [createCronJobSheetShown, setCreateCronJobSheetShown] = useState<
    Pick<CronJob, 'jobname' | 'schedule' | 'active' | 'command'> | undefined
  >()
  const [cronJobForDeletion, setCronJobForDeletion] = useState<CronJob | undefined>()

  const { data: cronJobs, isLoading } = useCronJobsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  if (isLoading) return <GenericSkeletonLoader />

  return (
    <>
      <div className="w-full space-y-4">
        {(cronJobs ?? []).length == 0 ? (
          <div className="grid text-center h-full w-full items-center justify-center border border-border rounded-md p-4 border-dashed">
            <p className="text-sm text-foreground">No cron jobs created yet</p>
            <p className="text-sm text-foreground-lighter">
              Create one by clicking "Create a new cron job"
            </p>
          </div>
        ) : (
          <div className="w-full space-y-4">
            {(cronJobs ?? []).map((job) => (
              <CronJobCard
                job={job}
                onEditCronJob={(job) => setCreateCronJobSheetShown(job)}
                onDeleteCronJob={(job) => setCronJobForDeletion(job)}
              />
            ))}
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
            selectedCronJob={createCronJobSheetShown}
            onClose={() => {
              setIsClosingCreateCronJobSheet(false)
              setCreateCronJobSheetShown(undefined)
            }}
            isClosing={isClosingCreateCronJobSheet}
            setIsClosing={setIsClosingCreateCronJobSheet}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
