import { useState } from 'react'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import AlertError from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { Cronjob, useCronjobsQuery } from 'data/database-cronjobs/database-cronjobs-query'
import { Button, Sheet, SheetContent } from 'ui'
import { CreateCronjobSheet } from './CreateCronjobSheet'
import { CronjobCard } from './CronjobCard'
import DeleteCronjob from './DeleteCronjob'

export const CronjobsListing = () => {
  const { project } = useProjectContext()

  // used for confirmation prompt in the Create Cronjob Sheet
  const [isClosingCreateCronJobSheet, setIsClosingCreateCronJobSheet] = useState(false)
  const [createCronJobSheetShown, setCreateCronJobSheetShown] = useState<
    Pick<Cronjob, 'jobname' | 'schedule' | 'active' | 'command'> | undefined
  >()
  const [cronjobForDeletion, setCronjobForDeletion] = useState<Cronjob | undefined>()

  const {
    data: cronjobs,
    error,
    isLoading,
    isError,
  } = useCronjobsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  if (isLoading) return <GenericSkeletonLoader />
  if (isError) return <AlertError error={error} subject="Failed to retrieve database functions" />

  return (
    <>
      {(cronjobs ?? []).length == 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <ProductEmptyState
            title="Cron jobs"
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
              pgcron jobs in PostgreSQL allow you to schedule and automate tasks such as running SQL
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
          {cronjobs.map((job) => (
            <CronjobCard
              job={job}
              editCronjob={(job) => setCreateCronJobSheetShown(job)}
              deleteCronjob={(job) => setCronjobForDeletion(job)}
            />
          ))}
        </div>
      )}
      <Sheet
        open={!!createCronJobSheetShown}
        onOpenChange={() => setIsClosingCreateCronJobSheet(true)}
      >
        <SheetContent size="default" tabIndex={undefined}>
          <CreateCronjobSheet
            selectedCronjob={createCronJobSheetShown}
            onClose={() => {
              setIsClosingCreateCronJobSheet(false)
              setCreateCronJobSheetShown(undefined)
            }}
            isClosing={isClosingCreateCronJobSheet}
            setIsClosing={setIsClosingCreateCronJobSheet}
          />
        </SheetContent>
      </Sheet>
      <DeleteCronjob
        visible={!!cronjobForDeletion}
        onClose={() => setCronjobForDeletion(undefined)}
        cronjob={cronjobForDeletion!}
      />
    </>
  )
}
