import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import AlertError from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { CronJob, useCronJobsQuery } from 'data/database-cron-jobs/database-cron-jobs-query'
import { Button, Sheet, SheetContent } from 'ui'
import { CreateCronJobSheet } from './CreateCronJobSheet'
import { CronJobCard } from './CronJobCard'
import DeleteCronJob from './DeleteCronJob'

export const CronJobsListing = () => {
  const { project } = useProjectContext()

  // used for confirmation prompt in the Create Cron Job Sheet
  const [isClosingCreateCronJobSheet, setIsClosingCreateCronJobSheet] = useState(false)
  const [createCronJobSheetShown, setCreateCronJobSheetShown] = useState<
    Pick<CronJob, 'jobname' | 'schedule' | 'active' | 'command'> | undefined
  >()
  const [cronJobForDeletion, setCronJobForDeletion] = useState<CronJob | undefined>()

  const {
    data: cronJobs,
    error,
    isLoading,
    isError,
  } = useCronJobsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  if (isLoading) return <GenericSkeletonLoader />
  if (isError) return <AlertError error={error} subject="Failed to retrieve database cron jobs" />

  return (
    <>
      {(cronJobs ?? []).length == 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <ProductEmptyState
            title="Cron Jobs"
            ctaButtonLabel="Create a new cron job"
            onClickCta={() =>
              setCreateCronJobSheetShown({
                jobname: '',
                schedule: '',
                command: '',
                active: true,
              })
            }
          >
            <p className="text-sm text-foreground-light">
              Cron jobs in PostgreSQL allow you to schedule and automate tasks such as running SQL
              queries or maintenance routines at specified intervals. These jobs are managed using
              cron-like syntax and are executed directly within the PostgreSQL server, making it
              easy to schedule recurring tasks without needing an external scheduler.
            </p>
          </ProductEmptyState>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <FormHeader
            title="Cron jobs"
            description="Use cron jobs to schedule and automate tasks such as running SQL queries or maintenance routines at specified intervals."
            actions={
              <Button
                type="primary"
                onClick={() =>
                  setCreateCronJobSheetShown({
                    jobname: '',
                    schedule: '',
                    command: '',
                    active: true,
                  })
                }
              >
                Create a new cron job
              </Button>
            }
          />
          {cronJobs.map((job) => (
            <CronJobCard
              job={job}
              editCronJob={(job) => setCreateCronJobSheetShown(job)}
              deleteCronJob={(job) => setCronJobForDeletion(job)}
            />
          ))}
        </div>
      )}
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
      <DeleteCronJob
        visible={!!cronJobForDeletion}
        onClose={() => setCronJobForDeletion(undefined)}
        cronJob={cronJobForDeletion!}
      />
    </>
  )
}
